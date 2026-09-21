import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ParsedImportRow } from './parse-import-file.util';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportSession {
  id: string;
  adminId: number;
  createdAt: Date;
  expiresAt: Date;

  /** Raw column headers from the file (original casing). */
  headers: string[];

  /** All data rows parsed from the file (raw text, not yet validated). */
  rows: ParsedImportRow[];

  /** Set to true after commitImport succeeds — prevents double-commit. */
  committed: boolean;

  /** IDs of created users (populated after commit). */
  committedUserIds: number[];

  /** Set to true after sendEmails succeeds — prevents double-send. */
  emailsSent: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Session lifetime from creation. */
const TTL_MS = 30 * 60 * 1_000; // 30 minutes

/** Maximum number of open (non-expired) sessions per admin. */
const MAX_SESSIONS_PER_ADMIN = 3;

/** Interval at which expired sessions are swept from memory. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ImportSessionService {
  private readonly sessions = new Map<string, ImportSession>();

  constructor() {
    // Periodic cleanup of expired sessions.
    setInterval(() => this.sweep(), SWEEP_INTERVAL_MS).unref();
  }

  // ── Create ────────────────────────────────────────────────

  create(
    adminId: number,
    headers: string[],
    rows: ParsedImportRow[],
  ): ImportSession {
    // Enforce per-admin session cap (count non-expired sessions only).
    const now = Date.now();
    const adminSessionCount = [...this.sessions.values()].filter(
      (s) => s.adminId === adminId && s.expiresAt.getTime() > now,
    ).length;

    if (adminSessionCount >= MAX_SESSIONS_PER_ADMIN) {
      throw new ConflictException(
        `Bạn đang có ${adminSessionCount} phiên import chưa hoàn tất. Vui lòng hoàn thành hoặc chờ phiên cũ hết hạn (30 phút).`,
      );
    }

    const session: ImportSession = {
      id: randomUUID(),
      adminId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + TTL_MS),
      headers,
      rows,
      committed: false,
      committedUserIds: [],
      emailsSent: false,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  // ── Get (with ownership check) ────────────────────────────

  /**
   * Retrieve a session, verifying it belongs to `adminId` and hasn't expired.
   * Throws 404 if not found/expired, 403 if wrong owner.
   */
  get(sessionId: string, adminId: number): ImportSession {
    const session = this.sessions.get(sessionId);

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      // Remove stale entry if it exists.
      if (session) this.sessions.delete(sessionId);
      throw new NotFoundException(
        'Phiên import không tồn tại hoặc đã hết hạn (30 phút). Vui lòng tải file lên lại.',
      );
    }

    if (session.adminId !== adminId) {
      throw new ForbiddenException(
        'Phiên import không thuộc về tài khoản này.',
      );
    }

    return session;
  }

  // ── Lifecycle mutations ───────────────────────────────────

  markCommitted(sessionId: string, userIds: number[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.committed = true;
      session.committedUserIds = userIds;
    }
  }

  markEmailsSent(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.emailsSent = true;
      // Session is fully done — remove it immediately so the admin can start
      // a fresh one without hitting the per-admin cap.
      this.sessions.delete(sessionId);
    }
  }

  /** Manually delete a session (e.g. admin cancels mid-wizard). */
  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // ── Sweep ─────────────────────────────────────────────────

  private sweep(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt.getTime() <= now) {
        this.sessions.delete(id);
      }
    }
  }
}
