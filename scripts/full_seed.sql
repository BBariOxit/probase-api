--
-- PostgreSQL database dump
--

\restrict ejJS91faRofXmMWeGrbE1LFopRoLwHvF0SKql0x1ASfrsCkM9wXJFVbceCFzR7Q

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS "topics_sourceProposalId_fkey";
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS "topics_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS "topics_roundId_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS "topics_lecturerId_fkey";
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS "topic_proposals_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS "topic_proposals_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS "topic_proposals_requestedLecturerId_fkey";
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS "topic_proposals_projectTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS "topic_proposals_acceptedByLecturerId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_topicId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_submittedById_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_requirementId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_groupId_topicId_fkey";
ALTER TABLE IF EXISTS ONLY public.submission_requirements DROP CONSTRAINT IF EXISTS "submission_requirements_roundId_fkey";
ALTER TABLE IF EXISTS ONLY public.student_profiles DROP CONSTRAINT IF EXISTS "student_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.student_profiles DROP CONSTRAINT IF EXISTS "student_profiles_majorId_fkey";
ALTER TABLE IF EXISTS ONLY public.round_eligibilities DROP CONSTRAINT IF EXISTS "round_eligibilities_roundId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_rounds DROP CONSTRAINT IF EXISTS "registration_rounds_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_rounds DROP CONSTRAINT IF EXISTS "registration_rounds_projectTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_rounds DROP CONSTRAINT IF EXISTS "registration_rounds_finalisedById_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_groups DROP CONSTRAINT IF EXISTS "registration_groups_topicId_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_groups DROP CONSTRAINT IF EXISTS "registration_groups_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_groups DROP CONSTRAINT IF EXISTS "registration_groups_leaderId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_group_members DROP CONSTRAINT IF EXISTS "registration_group_members_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_group_members DROP CONSTRAINT IF EXISTS "registration_group_members_groupId_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.registration_group_members DROP CONSTRAINT IF EXISTS "registration_group_members_assignedById_fkey";
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS "password_reset_tokens_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.lecturer_profiles DROP CONSTRAINT IF EXISTS "lecturer_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.councils DROP CONSTRAINT IF EXISTS "councils_semesterId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topics DROP CONSTRAINT IF EXISTS "council_topics_topicId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topics DROP CONSTRAINT IF EXISTS "council_topics_reviewerId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topics DROP CONSTRAINT IF EXISTS "council_topics_groupId_topicId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topics DROP CONSTRAINT IF EXISTS "council_topics_councilId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topic_grades DROP CONSTRAINT IF EXISTS "council_topic_grades_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_topic_grades DROP CONSTRAINT IF EXISTS "council_topic_grades_councilTopicId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_members DROP CONSTRAINT IF EXISTS "council_members_lecturerId_fkey";
ALTER TABLE IF EXISTS ONLY public.council_members DROP CONSTRAINT IF EXISTS "council_members_councilId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."topics_sourceProposalId_key";
DROP INDEX IF EXISTS public."topics_roundId_idx";
DROP INDEX IF EXISTS public."topics_id_semesterId_key";
DROP INDEX IF EXISTS public."submissions_topicId_idx";
DROP INDEX IF EXISTS public."submissions_groupId_requirementId_version_idx";
DROP INDEX IF EXISTS public."submission_requirements_roundId_sortOrder_idx";
DROP INDEX IF EXISTS public."submission_requirements_roundId_name_key";
DROP INDEX IF EXISTS public."student_profiles_userId_key";
DROP INDEX IF EXISTS public."student_profiles_studentCode_key";
DROP INDEX IF EXISTS public.semesters_code_key;
DROP INDEX IF EXISTS public."round_eligibilities_roundId_cohort_key";
DROP INDEX IF EXISTS public."registration_rounds_semesterId_projectTypeId_key";
DROP INDEX IF EXISTS public."registration_rounds_id_semesterId_key";
DROP INDEX IF EXISTS public."registration_groups_joinCode_key";
DROP INDEX IF EXISTS public."registration_groups_id_topicId_key";
DROP INDEX IF EXISTS public."registration_groups_id_semesterId_key";
DROP INDEX IF EXISTS public."registration_group_members_studentId_semesterId_idx";
DROP INDEX IF EXISTS public."registration_group_members_groupId_studentId_key";
DROP INDEX IF EXISTS public."refresh_tokens_tokenHash_key";
DROP INDEX IF EXISTS public.project_types_code_key;
DROP INDEX IF EXISTS public."password_reset_tokens_userId_idx";
DROP INDEX IF EXISTS public."password_reset_tokens_tokenHash_key";
DROP INDEX IF EXISTS public."notifications_userId_isRead_createdAt_idx";
DROP INDEX IF EXISTS public."notifications_dedupeKey_key";
DROP INDEX IF EXISTS public.majors_code_key;
DROP INDEX IF EXISTS public."lecturer_profiles_userId_key";
DROP INDEX IF EXISTS public."lecturer_profiles_lecturerCode_key";
DROP INDEX IF EXISTS public."council_topics_topicId_key";
DROP INDEX IF EXISTS public."council_topics_groupId_topicId_key";
DROP INDEX IF EXISTS public."council_topics_groupId_key";
DROP INDEX IF EXISTS public."council_topic_grades_councilTopicId_studentId_key";
DROP INDEX IF EXISTS public."council_members_councilId_lecturerId_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_pkey;
ALTER TABLE IF EXISTS ONLY public.topic_proposals DROP CONSTRAINT IF EXISTS topic_proposals_pkey;
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.submission_requirements DROP CONSTRAINT IF EXISTS submission_requirements_pkey;
ALTER TABLE IF EXISTS ONLY public.student_profiles DROP CONSTRAINT IF EXISTS student_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.semesters DROP CONSTRAINT IF EXISTS semesters_pkey;
ALTER TABLE IF EXISTS ONLY public.round_eligibilities DROP CONSTRAINT IF EXISTS round_eligibilities_pkey;
ALTER TABLE IF EXISTS ONLY public.registration_rounds DROP CONSTRAINT IF EXISTS registration_rounds_pkey;
ALTER TABLE IF EXISTS ONLY public.registration_groups DROP CONSTRAINT IF EXISTS registration_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.registration_group_members DROP CONSTRAINT IF EXISTS registration_group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.project_types DROP CONSTRAINT IF EXISTS project_types_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.majors DROP CONSTRAINT IF EXISTS majors_pkey;
ALTER TABLE IF EXISTS ONLY public.lecturer_profiles DROP CONSTRAINT IF EXISTS lecturer_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.councils DROP CONSTRAINT IF EXISTS councils_pkey;
ALTER TABLE IF EXISTS ONLY public.council_topics DROP CONSTRAINT IF EXISTS council_topics_pkey;
ALTER TABLE IF EXISTS ONLY public.council_topic_grades DROP CONSTRAINT IF EXISTS council_topic_grades_pkey;
ALTER TABLE IF EXISTS ONLY public.council_members DROP CONSTRAINT IF EXISTS council_members_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.topics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.topic_proposals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.submissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.submission_requirements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.student_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.semesters ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.round_eligibilities ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registration_rounds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registration_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registration_group_members ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.majors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lecturer_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.councils ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.council_topics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.council_topic_grades ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.council_members ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.topics_id_seq;
DROP TABLE IF EXISTS public.topics;
DROP SEQUENCE IF EXISTS public.topic_proposals_id_seq;
DROP TABLE IF EXISTS public.topic_proposals;
DROP SEQUENCE IF EXISTS public.submissions_id_seq;
DROP TABLE IF EXISTS public.submissions;
DROP SEQUENCE IF EXISTS public.submission_requirements_id_seq;
DROP TABLE IF EXISTS public.submission_requirements;
DROP SEQUENCE IF EXISTS public.student_profiles_id_seq;
DROP TABLE IF EXISTS public.student_profiles;
DROP SEQUENCE IF EXISTS public.semesters_id_seq;
DROP TABLE IF EXISTS public.semesters;
DROP SEQUENCE IF EXISTS public.round_eligibilities_id_seq;
DROP TABLE IF EXISTS public.round_eligibilities;
DROP SEQUENCE IF EXISTS public.registration_rounds_id_seq;
DROP TABLE IF EXISTS public.registration_rounds;
DROP SEQUENCE IF EXISTS public.registration_groups_id_seq;
DROP TABLE IF EXISTS public.registration_groups;
DROP SEQUENCE IF EXISTS public.registration_group_members_id_seq;
DROP TABLE IF EXISTS public.registration_group_members;
DROP SEQUENCE IF EXISTS public.refresh_tokens_id_seq;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP SEQUENCE IF EXISTS public.project_types_id_seq;
DROP TABLE IF EXISTS public.project_types;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.majors_id_seq;
DROP TABLE IF EXISTS public.majors;
DROP SEQUENCE IF EXISTS public.lecturer_profiles_id_seq;
DROP TABLE IF EXISTS public.lecturer_profiles;
DROP SEQUENCE IF EXISTS public.councils_id_seq;
DROP TABLE IF EXISTS public.councils;
DROP SEQUENCE IF EXISTS public.council_topics_id_seq;
DROP TABLE IF EXISTS public.council_topics;
DROP SEQUENCE IF EXISTS public.council_topic_grades_id_seq;
DROP TABLE IF EXISTS public.council_topic_grades;
DROP SEQUENCE IF EXISTS public.council_members_id_seq;
DROP TABLE IF EXISTS public.council_members;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP TYPE IF EXISTS public."TopicStatus";
DROP TYPE IF EXISTS public."TopicProposalStatus";
DROP TYPE IF EXISTS public."RoundPhase";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."RegistrationGroupStatus";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."GroupMemberStatus";
DROP TYPE IF EXISTS public."GroupJoinSource";
DROP TYPE IF EXISTS public."CouncilMemberRole";
DROP TYPE IF EXISTS public."AllocationMode";
--
-- Name: AllocationMode; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."AllocationMode" AS ENUM (
    'FIRST_COME',
    'PREFERENCE_ROUND'
);



--
-- Name: CouncilMemberRole; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."CouncilMemberRole" AS ENUM (
    'PRESIDENT',
    'SECRETARY',
    'MEMBER'
);



--
-- Name: GroupJoinSource; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."GroupJoinSource" AS ENUM (
    'SELF',
    'LINK',
    'ASSIGNED'
);



--
-- Name: GroupMemberStatus; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."GroupMemberStatus" AS ENUM (
    'INVITED',
    'ACCEPTED',
    'DECLINED'
);



--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."NotificationType" AS ENUM (
    'PROPOSAL_SUBMITTED',
    'PROPOSAL_ACCEPTED',
    'PROPOSAL_REJECTED',
    'GROUP_MEMBER_JOINED',
    'GROUP_MEMBER_REMOVED',
    'GROUP_DISBANDED',
    'ROUND_EXTENDED',
    'GROUP_MEMBER_ASSIGNED',
    'TOPIC_STUDENT_ASSIGNED',
    'ROUND_FINALIZED',
    'SUBMISSION_FEEDBACK',
    'REGISTRATION_CLOSING_SOON',
    'SUBMISSION_DUE_SOON',
    'GRADE_PUBLISHED',
    'DEADLINE_REMINDER'
);



--
-- Name: RegistrationGroupStatus; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."RegistrationGroupStatus" AS ENUM (
    'FORMING',
    'SUBMITTED',
    'APPROVED',
    'REJECTED'
);



--
-- Name: Role; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'LECTURER',
    'STUDENT'
);



--
-- Name: RoundPhase; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."RoundPhase" AS ENUM (
    'PREP',
    'OPEN',
    'RECONCILING',
    'EXTENDED',
    'FINALIZED'
);



--
-- Name: TopicProposalStatus; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."TopicProposalStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);



--
-- Name: TopicStatus; Type: TYPE; Schema: public; Owner: probase
--

CREATE TYPE public."TopicStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED'
);



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    "targetTable" text NOT NULL,
    "targetId" text NOT NULL,
    "oldValue" jsonb,
    "newValue" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: council_members; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.council_members (
    id integer NOT NULL,
    "councilId" integer NOT NULL,
    "lecturerId" integer NOT NULL,
    "councilRole" public."CouncilMemberRole" NOT NULL
);



--
-- Name: council_members_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.council_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: council_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.council_members_id_seq OWNED BY public.council_members.id;


--
-- Name: council_topic_grades; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.council_topic_grades (
    id integer NOT NULL,
    "councilTopicId" integer NOT NULL,
    "studentId" integer NOT NULL,
    "councilGrade" double precision,
    "reviewerGrade" double precision,
    "finalGrade" double precision,
    "finalisedAt" timestamp(3) without time zone
);



--
-- Name: council_topic_grades_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.council_topic_grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: council_topic_grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.council_topic_grades_id_seq OWNED BY public.council_topic_grades.id;


--
-- Name: council_topics; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.council_topics (
    id integer NOT NULL,
    "councilId" integer NOT NULL,
    "topicId" integer NOT NULL,
    "groupId" integer NOT NULL,
    "reviewerId" integer NOT NULL,
    "timeSlot" text
);



--
-- Name: council_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.council_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: council_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.council_topics_id_seq OWNED BY public.council_topics.id;


--
-- Name: councils; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.councils (
    id integer NOT NULL,
    "semesterId" integer NOT NULL,
    name text NOT NULL,
    location text,
    "defenseDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: councils_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.councils_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: councils_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.councils_id_seq OWNED BY public.councils.id;


--
-- Name: lecturer_profiles; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.lecturer_profiles (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "lecturerCode" text NOT NULL,
    "fullName" text NOT NULL,
    "academicTitle" text,
    phone text,
    bio text,
    "researchInterests" text,
    "maxMentoringQuota" integer
);



--
-- Name: lecturer_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.lecturer_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: lecturer_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.lecturer_profiles_id_seq OWNED BY public.lecturer_profiles.id;


--
-- Name: majors; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.majors (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL
);



--
-- Name: majors_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.majors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: majors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.majors_id_seq OWNED BY public.majors.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "targetId" integer,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dedupeKey" text
);



--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: project_types; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.project_types (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL
);



--
-- Name: project_types_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.project_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: project_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.project_types_id_seq OWNED BY public.project_types.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: registration_group_members; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.registration_group_members (
    id integer NOT NULL,
    "groupId" integer NOT NULL,
    "semesterId" integer NOT NULL,
    "studentId" integer NOT NULL,
    status public."GroupMemberStatus" DEFAULT 'ACCEPTED'::public."GroupMemberStatus" NOT NULL,
    "joinSource" public."GroupJoinSource" DEFAULT 'SELF'::public."GroupJoinSource" NOT NULL,
    "assignedById" integer,
    "assignedAt" timestamp(3) without time zone,
    "mentorGrade" double precision,
    "mentorComment" text,
    "joinedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: registration_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.registration_group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: registration_group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.registration_group_members_id_seq OWNED BY public.registration_group_members.id;


--
-- Name: registration_groups; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.registration_groups (
    id integer NOT NULL,
    "topicId" integer NOT NULL,
    "semesterId" integer NOT NULL,
    "leaderId" integer NOT NULL,
    name text,
    status public."RegistrationGroupStatus" DEFAULT 'FORMING'::public."RegistrationGroupStatus" NOT NULL,
    "lecturerFeedback" text,
    "openForJoin" boolean DEFAULT true NOT NULL,
    "declaredSize" integer,
    "holdUntil" timestamp(3) without time zone,
    "joinCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: registration_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.registration_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: registration_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.registration_groups_id_seq OWNED BY public.registration_groups.id;


--
-- Name: registration_rounds; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.registration_rounds (
    id integer NOT NULL,
    "semesterId" integer NOT NULL,
    "projectTypeId" integer NOT NULL,
    "registrationStart" timestamp(3) without time zone NOT NULL,
    "registrationEnd" timestamp(3) without time zone NOT NULL,
    phase public."RoundPhase" DEFAULT 'PREP'::public."RoundPhase" NOT NULL,
    "allocationMode" public."AllocationMode" DEFAULT 'FIRST_COME'::public."AllocationMode" NOT NULL,
    "finalisedAt" timestamp(3) without time zone,
    "finalisedById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: registration_rounds_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.registration_rounds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: registration_rounds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.registration_rounds_id_seq OWNED BY public.registration_rounds.id;


--
-- Name: round_eligibilities; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.round_eligibilities (
    id integer NOT NULL,
    "roundId" integer NOT NULL,
    cohort text NOT NULL
);



--
-- Name: round_eligibilities_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.round_eligibilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: round_eligibilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.round_eligibilities_id_seq OWNED BY public.round_eligibilities.id;


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.semesters (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "gradeSubmissionDeadline" timestamp(3) without time zone,
    "isActive" boolean DEFAULT false NOT NULL,
    "mentorWeight" double precision DEFAULT 0.4 NOT NULL,
    "reviewerWeight" double precision DEFAULT 0.3 NOT NULL,
    "councilWeight" double precision DEFAULT 0.3 NOT NULL
);



--
-- Name: semesters_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.semesters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: semesters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.semesters_id_seq OWNED BY public.semesters.id;


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.student_profiles (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "majorId" integer,
    "studentCode" text NOT NULL,
    "fullName" text NOT NULL,
    class text,
    cohort text,
    phone text,
    bio text,
    note text
);



--
-- Name: student_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.student_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: student_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.student_profiles_id_seq OWNED BY public.student_profiles.id;


--
-- Name: submission_requirements; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.submission_requirements (
    id integer NOT NULL,
    "roundId" integer NOT NULL,
    name text NOT NULL,
    "dueAt" timestamp(3) without time zone NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: submission_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.submission_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: submission_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.submission_requirements_id_seq OWNED BY public.submission_requirements.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    "topicId" integer NOT NULL,
    "groupId" integer NOT NULL,
    "requirementId" integer NOT NULL,
    "fileUrl" text,
    "filePublicId" text,
    "fileName" text,
    "fileSize" integer,
    "submissionUrl" text,
    version integer DEFAULT 1 NOT NULL,
    "submittedById" integer,
    "lecturerFeedback" text,
    "feedbackAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: topic_proposals; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.topic_proposals (
    id integer NOT NULL,
    "semesterId" integer NOT NULL,
    "studentId" integer NOT NULL,
    "projectTypeId" integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "expectedOutcomes" text NOT NULL,
    "requestedLecturerId" integer,
    "acceptedByLecturerId" integer,
    status public."TopicProposalStatus" DEFAULT 'PENDING'::public."TopicProposalStatus" NOT NULL,
    "lecturerFeedback" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: topic_proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.topic_proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: topic_proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.topic_proposals_id_seq OWNED BY public.topic_proposals.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    "semesterId" integer NOT NULL,
    "lecturerId" integer NOT NULL,
    "roundId" integer NOT NULL,
    "sourceProposalId" integer,
    title text NOT NULL,
    description text NOT NULL,
    "expectedOutcomes" text NOT NULL,
    "maxStudents" integer DEFAULT 1 NOT NULL,
    status public."TopicStatus" DEFAULT 'PENDING'::public."TopicStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: probase
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "mustChangePassword" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "failedPasswordCount" integer DEFAULT 0 NOT NULL,
    "passwordRetryAfter" timestamp(3) without time zone,
    "avatarUrl" text,
    "avatarPublicId" text
);



--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: probase
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: probase
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: council_members id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_members ALTER COLUMN id SET DEFAULT nextval('public.council_members_id_seq'::regclass);


--
-- Name: council_topic_grades id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topic_grades ALTER COLUMN id SET DEFAULT nextval('public.council_topic_grades_id_seq'::regclass);


--
-- Name: council_topics id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics ALTER COLUMN id SET DEFAULT nextval('public.council_topics_id_seq'::regclass);


--
-- Name: councils id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.councils ALTER COLUMN id SET DEFAULT nextval('public.councils_id_seq'::regclass);


--
-- Name: lecturer_profiles id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.lecturer_profiles ALTER COLUMN id SET DEFAULT nextval('public.lecturer_profiles_id_seq'::regclass);


--
-- Name: majors id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.majors ALTER COLUMN id SET DEFAULT nextval('public.majors_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: project_types id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.project_types ALTER COLUMN id SET DEFAULT nextval('public.project_types_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: registration_group_members id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_group_members ALTER COLUMN id SET DEFAULT nextval('public.registration_group_members_id_seq'::regclass);


--
-- Name: registration_groups id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_groups ALTER COLUMN id SET DEFAULT nextval('public.registration_groups_id_seq'::regclass);


--
-- Name: registration_rounds id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_rounds ALTER COLUMN id SET DEFAULT nextval('public.registration_rounds_id_seq'::regclass);


--
-- Name: round_eligibilities id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.round_eligibilities ALTER COLUMN id SET DEFAULT nextval('public.round_eligibilities_id_seq'::regclass);


--
-- Name: semesters id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.semesters ALTER COLUMN id SET DEFAULT nextval('public.semesters_id_seq'::regclass);


--
-- Name: student_profiles id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.student_profiles ALTER COLUMN id SET DEFAULT nextval('public.student_profiles_id_seq'::regclass);


--
-- Name: submission_requirements id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submission_requirements ALTER COLUMN id SET DEFAULT nextval('public.submission_requirements_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: topic_proposals id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals ALTER COLUMN id SET DEFAULT nextval('public.topic_proposals_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.audit_logs (id, "userId", action, "targetTable", "targetId", "oldValue", "newValue", "createdAt") FROM stdin;
1	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": []}	{"requirements": [{"name": "Slide bß¦úo vß+ç", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:21:05.713
2	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "Slide bß¦úo vß+ç", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:46:59.153
3	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:50:42.699
4	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:51:15.544
5	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:53:32.949
6	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:54:51.965
7	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 03:58:27.391
8	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:00:47.965
9	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:01:05.69
10	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:04:28.789
11	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	2	{"requirements": []}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:04:48.9
12	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	3	{"requirements": []}	{"requirements": [{"name": "Slide", "dueAt": "2026-10-08T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-11-06T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-09-24T00:00:00.000Z", "isRequired": true}, {"name": "B+ío c+ío", "dueAt": "2026-10-10T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:05:22.609
13	1	SET_SEMESTER_ROUNDS	semesters	1	{"rounds": [{"projectTypeId": 1, "registrationEnd": "2026-10-12T02:45:19.697Z", "registrationStart": "2026-09-14T02:45:19.697Z"}, {"projectTypeId": 2, "registrationEnd": "2026-10-12T02:45:19.733Z", "registrationStart": "2026-09-14T02:45:19.733Z"}, {"projectTypeId": 3, "registrationEnd": "2026-10-05T02:45:19.749Z", "registrationStart": "2026-09-14T02:45:19.749Z"}]}	{"rounds": [{"cohorts": ["2023"], "projectTypeId": 2, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2024"], "projectTypeId": 1, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2022"], "projectTypeId": 3, "registrationEnd": "2026-10-05T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}]}	2026-09-21 04:05:32.998
14	1	SET_SEMESTER_ROUNDS	semesters	1	{"rounds": [{"projectTypeId": 1, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"projectTypeId": 2, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"projectTypeId": 3, "registrationEnd": "2026-10-05T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}]}	{"rounds": [{"cohorts": ["2023"], "projectTypeId": 2, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2024"], "projectTypeId": 1, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2022"], "projectTypeId": 3, "registrationEnd": "2026-10-05T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}]}	2026-09-21 04:05:37.72
15	1	SET_SEMESTER_ROUNDS	semesters	1	{"rounds": [{"projectTypeId": 1, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"projectTypeId": 2, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"projectTypeId": 3, "registrationEnd": "2026-10-05T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}]}	{"rounds": [{"cohorts": ["2023"], "projectTypeId": 2, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2024"], "projectTypeId": 1, "registrationEnd": "2026-10-12T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}, {"cohorts": ["2022"], "projectTypeId": 3, "registrationEnd": "2026-10-05T00:00:00.000Z", "registrationStart": "2026-09-14T00:00:00.000Z"}]}	2026-09-21 04:08:54.822
16	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	1	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-01T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:18:31.87
17	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	2	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-10-02T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:18:35.309
18	1	SET_SUBMISSION_REQUIREMENTS	registration_rounds	3	{"requirements": [{"name": "M+ú nguß+ôn", "dueAt": "2026-11-06T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-09-24T00:00:00.000Z", "isRequired": true}, {"name": "Slide", "dueAt": "2026-10-08T00:00:00.000Z", "isRequired": true}, {"name": "B+ío c+ío", "dueAt": "2026-10-10T00:00:00.000Z", "isRequired": true}]}	{"requirements": [{"name": "Slide", "dueAt": "2026-10-08T00:00:00.000Z", "isRequired": true}, {"name": "M+ú nguß+ôn", "dueAt": "2026-11-06T00:00:00.000Z", "isRequired": true}, {"name": "-Éß+ü c¦¦¦íng", "dueAt": "2026-09-24T00:00:00.000Z", "isRequired": true}, {"name": "B+ío c+ío", "dueAt": "2026-10-10T00:00:00.000Z", "isRequired": true}]}	2026-09-21 04:18:36.726
19	1	UPDATE_STUDENT_PROFILE	student_profiles	1	{"class": "CTK46", "cohort": "2022", "fullName": "Nguyß+àn V-ân A", "studentCode": "2212345"}	{"class": "CTK46", "cohort": "2022", "fullName": "Nguyß+àn V-ân A", "studentCode": "2299999"}	2026-09-21 07:42:26.609
20	1	UPDATE_USER	users	2	{"email": "2212345@dlu.edu.vn"}	{"email": "2277777@dlu.edu.vn"}	2026-09-21 07:42:51.587
21	1	UPDATE_STUDENT_PROFILE	student_profiles	1	{"class": "CTK46", "cohort": "2022", "fullName": "Nguyß+àn V-ân A", "studentCode": "2299999"}	{"class": "CTK46", "cohort": "2022", "fullName": "Nguyß+àn V-ân A", "studentCode": "2277777"}	2026-09-21 07:42:57.946
22	1	CREATE_USER	users	8	\N	{"role": "STUDENT", "email": "2212345@dlu.edu.vn"}	2026-09-21 07:50:27.25
23	1	DELETE_USER	users	8	{"role": "STUDENT", "email": "2212345@dlu.edu.vn"}	\N	2026-09-21 07:58:37.732
24	1	CREATE_USER	users	9	\N	{"role": "STUDENT", "email": "2212345@dlu.edu.vn"}	2026-09-21 08:03:16.057
25	2	REMOVE_GROUP_MEMBER	registration_group_members	3	{"groupId": 2, "studentId": 8, "joinSource": "SELF", "studentCode": "2212345"}	\N	2026-09-21 08:17:13.526
26	2	REMOVE_GROUP_MEMBER	registration_group_members	4	{"groupId": 2, "studentId": 8, "joinSource": "SELF", "studentCode": "2212345"}	\N	2026-09-21 08:26:13.802
27	2	REMOVE_GROUP_MEMBER	registration_group_members	5	{"groupId": 2, "studentId": 8, "joinSource": "LINK", "studentCode": "2212345"}	\N	2026-09-21 08:36:38.268
28	1	BULK_IMPORT_COMMIT	users	1	\N	{"failedCount": 0, "createdCount": 3}	2026-09-21 10:12:36.747
29	1	DELETE_USER	users	10	{"role": "LECTURER", "email": "phanbao2648@gmail.com"}	\N	2026-09-21 10:25:17.604
30	1	DELETE_USER	users	11	{"role": "LECTURER", "email": "sunalex2345@gmail.com"}	\N	2026-09-21 10:25:20.885
31	1	DELETE_USER	users	12	{"role": "LECTURER", "email": "phanthaibao2648@gmail.com"}	\N	2026-09-21 10:25:26.417
32	1	BULK_IMPORT_COMMIT	users	1	\N	{"failedCount": 0, "createdCount": 3}	2026-09-21 10:26:10.618
33	1	DELETE_USER	users	13	{"role": "LECTURER", "email": "phanbao2648@gmail.com"}	\N	2026-09-21 10:30:31.354
34	1	DELETE_USER	users	14	{"role": "LECTURER", "email": "phanthaibao2648@gmail.com"}	\N	2026-09-21 10:30:34.086
35	1	DELETE_USER	users	15	{"role": "LECTURER", "email": "sunalex2345@gmail.com"}	\N	2026-09-21 10:30:36.45
36	1	BULK_IMPORT_COMMIT	users	1	\N	{"failedCount": 0, "createdCount": 3}	2026-09-21 10:31:16.088
37	1	BULK_IMPORT_SEND_EMAILS	users	1	\N	{"sent": 3, "failed": 0}	2026-09-21 10:31:18.047
\.


--
-- Data for Name: council_members; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.council_members (id, "councilId", "lecturerId", "councilRole") FROM stdin;
\.


--
-- Data for Name: council_topic_grades; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.council_topic_grades (id, "councilTopicId", "studentId", "councilGrade", "reviewerGrade", "finalGrade", "finalisedAt") FROM stdin;
\.


--
-- Data for Name: council_topics; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.council_topics (id, "councilId", "topicId", "groupId", "reviewerId", "timeSlot") FROM stdin;
\.


--
-- Data for Name: councils; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.councils (id, "semesterId", name, location, "defenseDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: lecturer_profiles; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.lecturer_profiles (id, "userId", "lecturerCode", "fullName", "academicTitle", phone, bio, "researchInterests", "maxMentoringQuota") FROM stdin;
1	3	GV001	Trß¦ºn Thß+ï B	TS	\N	\N	Kß+¦ thuß¦¡t phß¦ºn mß+üm, kiß+âm thß+¡ tß+¦ -æß+Öng	\N
2	4	GV002	L+¬ V-ân C	ThS	\N	\N	Hß+ç thß+æng th+¦ng tin, c¦í sß+ƒ dß+» liß+çu	\N
9	16	GV657467	Phan Th+íi Bß¦úo	\N	\N	\N	\N	\N
10	17	GV759969	Sun Alex	\N	\N	\N	\N	\N
11	18	GV919576	Bß¦úo Phan	\N	\N	\N	\N	\N
\.


--
-- Data for Name: majors; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.majors (id, name, code) FROM stdin;
1	Kß+¦ thuß¦¡t Phß¦ºn mß+üm	KTPM
2	Hß+ç thß+æng Th+¦ng tin	HTTT
3	Khoa hß+ìc M+íy t+¡nh	KHMT
4	Tr+¡ tuß+ç Nh+ón tß¦ío	TTNT
5	Mß¦íng m+íy t+¡nh v+á Truyß+ün th+¦ng	MMT
6	An to+án Th+¦ng tin	ATTT
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.notifications (id, "userId", type, title, content, "targetId", "isRead", "createdAt", "dedupeKey") FROM stdin;
1	2	GROUP_MEMBER_JOINED	C+¦ ng¦¦ß+¥i tham gia nh+¦m cß+ºa bß¦ín	phanbao vß+½a v+áo nh+¦m -æß+ü t+ái "test5".	2	f	2026-09-21 08:16:41.478	\N
2	9	GROUP_MEMBER_REMOVED	Bß¦ín -æ+ú bß+ï -æ¦¦a ra khß+Åi nh+¦m	Tr¦¦ß+ƒng nh+¦m -æ+ú -æ¦¦a bß¦ín ra khß+Åi nh+¦m -æß+ü t+ái "test5". Nß¦+u cß+òng -æ-âng k++ c+¦n mß+ƒ, bß¦ín c+¦ thß+â chß+ìn mß+Öt -æß+ü t+ái kh+íc.	5	t	2026-09-21 08:17:13.617	\N
3	2	GROUP_MEMBER_JOINED	C+¦ ng¦¦ß+¥i tham gia nh+¦m cß+ºa bß¦ín	phanbao vß+½a v+áo nh+¦m -æß+ü t+ái "test5".	2	f	2026-09-21 08:18:27.166	\N
6	9	GROUP_MEMBER_REMOVED	Bß¦ín -æ+ú bß+ï -æ¦¦a ra khß+Åi nh+¦m	Tr¦¦ß+ƒng nh+¦m -æ+ú -æ¦¦a bß¦ín ra khß+Åi nh+¦m -æß+ü t+ái "test5". Nß¦+u cß+òng -æ-âng k++ c+¦n mß+ƒ, bß¦ín c+¦ thß+â chß+ìn mß+Öt -æß+ü t+ái kh+íc.	5	t	2026-09-21 08:36:38.29	\N
4	9	GROUP_MEMBER_REMOVED	Bß¦ín -æ+ú bß+ï -æ¦¦a ra khß+Åi nh+¦m	Tr¦¦ß+ƒng nh+¦m -æ+ú -æ¦¦a bß¦ín ra khß+Åi nh+¦m -æß+ü t+ái "test5". Nß¦+u cß+òng -æ-âng k++ c+¦n mß+ƒ, bß¦ín c+¦ thß+â chß+ìn mß+Öt -æß+ü t+ái kh+íc.	5	t	2026-09-21 08:26:13.86	\N
8	2	GROUP_MEMBER_JOINED	C+¦ ng¦¦ß+¥i tham gia nh+¦m cß+ºa bß¦ín	phanbao vß+½a v+áo nh+¦m -æß+ü t+ái "test5".	2	t	2026-09-21 08:40:05.089	\N
7	2	GROUP_MEMBER_JOINED	C+¦ ng¦¦ß+¥i tham gia nh+¦m cß+ºa bß¦ín	Phß¦ím Thß+ï B vß+½a v+áo nh+¦m -æß+ü t+ái "test5".	2	t	2026-09-21 08:37:28.174	\N
5	2	GROUP_MEMBER_JOINED	C+¦ ng¦¦ß+¥i tham gia nh+¦m cß+ºa bß¦ín	phanbao vß+½a v+áo nh+¦m -æß+ü t+ái "test5".	2	t	2026-09-21 08:36:22.155	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.password_reset_tokens (id, "userId", "tokenHash", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: project_types; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.project_types (id, name, code) FROM stdin;
1	-Éß+ô +ín C¦í sß+ƒ	DACS
2	-Éß+ô +ín Chuy+¬n ng+ánh	DACN
3	-Éß+ô +ín Tß+æt nghiß+çp	DATN
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.refresh_tokens (id, "userId", "tokenHash", "expiresAt", "createdAt") FROM stdin;
57	1	dc4e4cf2c8d1372b3a637647d11d5e58a2f0e6e249dc17677b40bda4fc32bf15	2026-10-21 07:50:27.097	2026-09-21 07:50:27.1
58	1	65e85f67638aea3fd0f743685364a5ac8440db39bca35a42e3bdaf6fea323ff7	2026-10-21 07:51:33.868	2026-09-21 07:51:33.868
59	1	9430e9e0e59d6d212d9afb710e1d4180fc83f1c35160c95c39f774e7d0c37762	2026-10-21 07:59:07.719	2026-09-21 07:59:07.729
66	3	87d397ce6d2c961f2cb77b1f9126c2023fc14859360ce4ba2a8d5168cb9cd27e	2026-10-21 08:07:54.764	2026-09-21 08:07:54.764
105	2	440f65df4361824483b7ba2a149a17e1d353beb297464581a03093aaee01180c	2026-10-21 10:46:59.472	2026-09-21 10:46:59.475
107	9	98dfed1cf401ee1295b90eda81c5a0e1d3f9c012445fac2edd13552fffe839c0	2026-10-21 11:01:43.326	2026-09-21 11:01:43.334
108	1	afba259694915b8f23257a4498b610acfb49e5b0879c50d34dad9d0d4dc36014	2026-10-21 11:06:16.256	2026-09-21 11:06:16.26
\.


--
-- Data for Name: registration_group_members; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.registration_group_members (id, "groupId", "semesterId", "studentId", status, "joinSource", "assignedById", "assignedAt", "mentorGrade", "mentorComment", "joinedAt", "createdAt") FROM stdin;
1	1	1	1	DECLINED	SELF	\N	\N	\N	\N	2026-09-21 07:05:16.172	2026-09-21 07:05:16.172
2	2	1	1	ACCEPTED	SELF	\N	\N	\N	\N	2026-09-21 07:11:33.503	2026-09-21 07:11:33.504
7	2	1	8	ACCEPTED	SELF	\N	\N	\N	\N	2026-09-21 08:40:05.076	2026-09-21 08:40:05.076
\.


--
-- Data for Name: registration_groups; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.registration_groups (id, "topicId", "semesterId", "leaderId", name, status, "lecturerFeedback", "openForJoin", "declaredSize", "holdUntil", "joinCode", "createdAt", "updatedAt") FROM stdin;
1	5	1	1	\N	REJECTED	\N	t	3	2026-09-22 07:05:16.091	I0v02FtqnnV_5K_kEL1VpQ	2026-09-21 07:05:16.1	2026-09-21 07:11:29.929
2	5	1	1	\N	FORMING	\N	t	3	2026-09-22 07:11:33.467	1MQoUYnazju64aJnNdw1lg	2026-09-21 07:11:33.487	2026-09-21 08:40:05.081
\.


--
-- Data for Name: registration_rounds; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.registration_rounds (id, "semesterId", "projectTypeId", "registrationStart", "registrationEnd", phase, "allocationMode", "finalisedAt", "finalisedById", "createdAt", "updatedAt") FROM stdin;
2	1	2	2026-09-14 00:00:00	2026-10-12 00:00:00	OPEN	FIRST_COME	\N	\N	2026-09-21 02:45:19.738	2026-09-21 04:08:54.787
1	1	1	2026-09-14 00:00:00	2026-10-12 00:00:00	OPEN	FIRST_COME	\N	\N	2026-09-21 02:45:19.711	2026-09-21 04:08:54.812
3	1	3	2026-09-14 00:00:00	2026-10-05 00:00:00	OPEN	FIRST_COME	\N	\N	2026-09-21 02:45:19.751	2026-09-21 04:08:54.817
\.


--
-- Data for Name: round_eligibilities; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.round_eligibilities (id, "roundId", cohort) FROM stdin;
13	1	2024
14	2	2023
15	3	2022
\.


--
-- Data for Name: semesters; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.semesters (id, name, code, "startDate", "endDate", "gradeSubmissionDeadline", "isActive", "mentorWeight", "reviewerWeight", "councilWeight") FROM stdin;
1	Hß+ìc kß+¦ 1 n-âm hß+ìc 2026-2027	HK1-2026-2027	2026-08-22 02:45:19.676	2027-01-19 02:45:19.676	2027-01-09 02:45:19.676	t	0.4	0.3	0.3
\.


--
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.student_profiles (id, "userId", "majorId", "studentCode", "fullName", class, cohort, phone, bio, note) FROM stdin;
1	2	1	2277777	Nguyß+àn V-ân A	CTK46	2022	\N	\N	\N
5	6	1	2288888	Phß¦ím Thß+ï B	CTK46	2022	\N	\N	\N
6	7	1	2299999	L+¬ V-ân C	CTK46	2022	\N	\N	\N
8	9	1	2212345	phanbao	CTK46B	2022	\N	\N	\N
\.


--
-- Data for Name: submission_requirements; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.submission_requirements (id, "roundId", name, "dueAt", "isRequired", "sortOrder", "createdAt", "updatedAt") FROM stdin;
1	1	-Éß+ü c¦¦¦íng	2026-10-01 00:00:00	t	0	2026-09-21 03:21:05.689	2026-09-21 04:18:31.864
2	1	M+ú nguß+ôn	2026-10-02 00:00:00	t	1	2026-09-21 03:54:51.958	2026-09-21 04:18:31.868
3	2	-Éß+ü c¦¦¦íng	2026-10-02 00:00:00	t	0	2026-09-21 04:04:48.896	2026-09-21 04:18:35.308
4	3	Slide	2026-10-08 00:00:00	t	0	2026-09-21 04:05:22.594	2026-09-21 04:18:36.721
5	3	M+ú nguß+ôn	2026-11-06 00:00:00	t	1	2026-09-21 04:05:22.596	2026-09-21 04:18:36.722
6	3	-Éß+ü c¦¦¦íng	2026-09-24 00:00:00	t	2	2026-09-21 04:05:22.599	2026-09-21 04:18:36.723
7	3	B+ío c+ío	2026-10-10 00:00:00	t	3	2026-09-21 04:05:22.607	2026-09-21 04:18:36.725
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.submissions (id, "topicId", "groupId", "requirementId", "fileUrl", "filePublicId", "fileName", "fileSize", "submissionUrl", version, "submittedById", "lecturerFeedback", "feedbackAt", "submittedAt") FROM stdin;
\.


--
-- Data for Name: topic_proposals; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.topic_proposals (id, "semesterId", "studentId", "projectTypeId", title, description, "expectedOutcomes", "requestedLecturerId", "acceptedByLecturerId", status, "lecturerFeedback", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.topics (id, "semesterId", "lecturerId", "roundId", "sourceProposalId", title, description, "expectedOutcomes", "maxStudents", status, "createdAt", "updatedAt") FROM stdin;
1	1	1	2	\N	test 1	test	test	3	APPROVED	2026-09-21 04:34:48.996	2026-09-21 04:37:33.576
2	1	1	1	\N	test2	test2	test2	2	PENDING	2026-09-21 04:37:52.386	2026-09-21 04:37:52.386
4	1	1	2	\N	test4	test4	test4	3	PENDING	2026-09-21 04:42:53.715	2026-09-21 04:42:53.715
3	1	1	2	\N	test3	test3	test3	5	OPEN	2026-09-21 04:40:03.079	2026-09-21 04:43:25.49
5	1	1	3	\N	test5	test5	test5	4	OPEN	2026-09-21 04:43:53.961	2026-09-21 04:45:05.616
6	1	1	3	\N	test6	test6	test6	3	OPEN	2026-09-21 06:57:38.267	2026-09-21 06:57:55.944
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: probase
--

COPY public.users (id, email, password, role, "isActive", "mustChangePassword", "createdAt", "updatedAt", "failedPasswordCount", "passwordRetryAfter", "avatarUrl", "avatarPublicId") FROM stdin;
1	admin@probase.dev	$2b$10$ziPoyxUoP5B.lNOoS7qS5OIz8ONJ6bNvUSXt0phrIbC.b8zol4lX.	ADMIN	t	f	2026-09-21 02:45:19.824	2026-09-21 02:45:19.824	0	\N	\N	\N
3	gv001@probase.dev	$2b$10$g.uO.1vzkuEIS.FO8OMm8OdATg8E99lV9sN6rL0DeBcdieSRiNVKW	LECTURER	t	f	2026-09-21 02:45:19.977	2026-09-21 02:45:19.977	0	\N	\N	\N
4	gv002@probase.dev	$2b$10$g.uO.1vzkuEIS.FO8OMm8OdATg8E99lV9sN6rL0DeBcdieSRiNVKW	LECTURER	t	f	2026-09-21 02:45:19.989	2026-09-21 02:45:19.989	0	\N	\N	\N
2	2277777@dlu.edu.vn	$2b$10$h5Zzg9e1jpCr74K8hY/YmO4NBcxNgj2XurUU7dXopekYrhQWIMElq	STUDENT	t	f	2026-09-21 02:45:19.905	2026-09-21 07:42:51.58	0	\N	\N	\N
7	2299999@dlu.edu.vn	$2b$10$5YnVF7NQoH1V2Lz0uzdtauGt295GKKcvYdQXeAMdJjN8gYiNxj3Ga	STUDENT	t	t	2026-09-21 07:42:59.311	2026-09-21 07:42:59.311	0	\N	\N	\N
6	2288888@dlu.edu.vn	$2b$10$UhKq4RV0ybWLYkl/gsxXIOoHuq0kTQK49SB0M9qyjnc.f8fZ8a3GS	STUDENT	t	f	2026-09-21 07:42:59.226	2026-09-21 07:46:03.644	0	\N	\N	\N
9	2212345@dlu.edu.vn	$2b$10$ja2dHQJZie1t3BpmYaoOOOsDoZlLMaXqeWtakjdXvIez/NYXgTzwG	STUDENT	t	f	2026-09-21 08:03:15.995	2026-09-21 08:10:34.533	0	\N	\N	\N
17	sunalex2345@gmail.com	$2b$10$yep3OQlLp3jS92ziS6hydOuFJ8zADO5h77jVdQTNcVwlGZkaSFsPi	LECTURER	t	t	2026-09-21 10:31:16.064	2026-09-21 10:31:17.103	0	\N	\N	\N
16	phanbao2648@gmail.com	$2b$10$S9hA9SEDejKwVghTvP/gmOc0h8XSH.wa0d18xj9Mo39bQu8qKz7mS	LECTURER	t	t	2026-09-21 10:31:16.033	2026-09-21 10:31:17.105	0	\N	\N	\N
18	phanthaibao2648@gmail.com	$2b$10$iJ1xFROKJjIEg6E44cqTcud4Z5Lp3P26Ap2ulj6M1lpyi/HXBvgB6	LECTURER	t	t	2026-09-21 10:31:16.071	2026-09-21 10:31:17.104	0	\N	\N	\N
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 37, true);


--
-- Name: council_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.council_members_id_seq', 1, false);


--
-- Name: council_topic_grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.council_topic_grades_id_seq', 1, false);


--
-- Name: council_topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.council_topics_id_seq', 1, false);


--
-- Name: councils_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.councils_id_seq', 1, false);


--
-- Name: lecturer_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.lecturer_profiles_id_seq', 11, true);


--
-- Name: majors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.majors_id_seq', 12, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.notifications_id_seq', 8, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: project_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.project_types_id_seq', 6, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 108, true);


--
-- Name: registration_group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.registration_group_members_id_seq', 7, true);


--
-- Name: registration_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.registration_groups_id_seq', 2, true);


--
-- Name: registration_rounds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.registration_rounds_id_seq', 3, true);


--
-- Name: round_eligibilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.round_eligibilities_id_seq', 15, true);


--
-- Name: semesters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.semesters_id_seq', 2, true);


--
-- Name: student_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.student_profiles_id_seq', 8, true);


--
-- Name: submission_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.submission_requirements_id_seq', 7, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: topic_proposals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.topic_proposals_id_seq', 1, false);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.topics_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: probase
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: council_members council_members_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_members
    ADD CONSTRAINT council_members_pkey PRIMARY KEY (id);


--
-- Name: council_topic_grades council_topic_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topic_grades
    ADD CONSTRAINT council_topic_grades_pkey PRIMARY KEY (id);


--
-- Name: council_topics council_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics
    ADD CONSTRAINT council_topics_pkey PRIMARY KEY (id);


--
-- Name: councils councils_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.councils
    ADD CONSTRAINT councils_pkey PRIMARY KEY (id);


--
-- Name: lecturer_profiles lecturer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.lecturer_profiles
    ADD CONSTRAINT lecturer_profiles_pkey PRIMARY KEY (id);


--
-- Name: majors majors_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: project_types project_types_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT project_types_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: registration_group_members registration_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_group_members
    ADD CONSTRAINT registration_group_members_pkey PRIMARY KEY (id);


--
-- Name: registration_groups registration_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_groups
    ADD CONSTRAINT registration_groups_pkey PRIMARY KEY (id);


--
-- Name: registration_rounds registration_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_rounds
    ADD CONSTRAINT registration_rounds_pkey PRIMARY KEY (id);


--
-- Name: round_eligibilities round_eligibilities_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.round_eligibilities
    ADD CONSTRAINT round_eligibilities_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- Name: submission_requirements submission_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submission_requirements
    ADD CONSTRAINT submission_requirements_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: topic_proposals topic_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT topic_proposals_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: council_members_councilId_lecturerId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "council_members_councilId_lecturerId_key" ON public.council_members USING btree ("councilId", "lecturerId");


--
-- Name: council_topic_grades_councilTopicId_studentId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "council_topic_grades_councilTopicId_studentId_key" ON public.council_topic_grades USING btree ("councilTopicId", "studentId");


--
-- Name: council_topics_groupId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "council_topics_groupId_key" ON public.council_topics USING btree ("groupId");


--
-- Name: council_topics_groupId_topicId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "council_topics_groupId_topicId_key" ON public.council_topics USING btree ("groupId", "topicId");


--
-- Name: council_topics_topicId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "council_topics_topicId_key" ON public.council_topics USING btree ("topicId");


--
-- Name: lecturer_profiles_lecturerCode_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "lecturer_profiles_lecturerCode_key" ON public.lecturer_profiles USING btree ("lecturerCode");


--
-- Name: lecturer_profiles_userId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "lecturer_profiles_userId_key" ON public.lecturer_profiles USING btree ("userId");


--
-- Name: majors_code_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX majors_code_key ON public.majors USING btree (code);


--
-- Name: notifications_dedupeKey_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "notifications_dedupeKey_key" ON public.notifications USING btree ("dedupeKey");


--
-- Name: notifications_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON public.notifications USING btree ("userId", "isRead", "createdAt");


--
-- Name: password_reset_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON public.password_reset_tokens USING btree ("tokenHash");


--
-- Name: password_reset_tokens_userId_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "password_reset_tokens_userId_idx" ON public.password_reset_tokens USING btree ("userId");


--
-- Name: project_types_code_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX project_types_code_key ON public.project_types USING btree (code);


--
-- Name: refresh_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: registration_group_members_groupId_studentId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_group_members_groupId_studentId_key" ON public.registration_group_members USING btree ("groupId", "studentId");


--
-- Name: registration_group_members_studentId_semesterId_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "registration_group_members_studentId_semesterId_idx" ON public.registration_group_members USING btree ("studentId", "semesterId");


--
-- Name: registration_groups_id_semesterId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_groups_id_semesterId_key" ON public.registration_groups USING btree (id, "semesterId");


--
-- Name: registration_groups_id_topicId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_groups_id_topicId_key" ON public.registration_groups USING btree (id, "topicId");


--
-- Name: registration_groups_joinCode_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_groups_joinCode_key" ON public.registration_groups USING btree ("joinCode");


--
-- Name: registration_rounds_id_semesterId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_rounds_id_semesterId_key" ON public.registration_rounds USING btree (id, "semesterId");


--
-- Name: registration_rounds_semesterId_projectTypeId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "registration_rounds_semesterId_projectTypeId_key" ON public.registration_rounds USING btree ("semesterId", "projectTypeId");


--
-- Name: round_eligibilities_roundId_cohort_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "round_eligibilities_roundId_cohort_key" ON public.round_eligibilities USING btree ("roundId", cohort);


--
-- Name: semesters_code_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX semesters_code_key ON public.semesters USING btree (code);


--
-- Name: student_profiles_studentCode_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "student_profiles_studentCode_key" ON public.student_profiles USING btree ("studentCode");


--
-- Name: student_profiles_userId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "student_profiles_userId_key" ON public.student_profiles USING btree ("userId");


--
-- Name: submission_requirements_roundId_name_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "submission_requirements_roundId_name_key" ON public.submission_requirements USING btree ("roundId", name);


--
-- Name: submission_requirements_roundId_sortOrder_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "submission_requirements_roundId_sortOrder_idx" ON public.submission_requirements USING btree ("roundId", "sortOrder");


--
-- Name: submissions_groupId_requirementId_version_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "submissions_groupId_requirementId_version_idx" ON public.submissions USING btree ("groupId", "requirementId", version);


--
-- Name: submissions_topicId_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "submissions_topicId_idx" ON public.submissions USING btree ("topicId");


--
-- Name: topics_id_semesterId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "topics_id_semesterId_key" ON public.topics USING btree (id, "semesterId");


--
-- Name: topics_roundId_idx; Type: INDEX; Schema: public; Owner: probase
--

CREATE INDEX "topics_roundId_idx" ON public.topics USING btree ("roundId");


--
-- Name: topics_sourceProposalId_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX "topics_sourceProposalId_key" ON public.topics USING btree ("sourceProposalId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: probase
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: council_members council_members_councilId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_members
    ADD CONSTRAINT "council_members_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES public.councils(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: council_members council_members_lecturerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_members
    ADD CONSTRAINT "council_members_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES public.lecturer_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: council_topic_grades council_topic_grades_councilTopicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topic_grades
    ADD CONSTRAINT "council_topic_grades_councilTopicId_fkey" FOREIGN KEY ("councilTopicId") REFERENCES public.council_topics(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: council_topic_grades council_topic_grades_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topic_grades
    ADD CONSTRAINT "council_topic_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: council_topics council_topics_councilId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics
    ADD CONSTRAINT "council_topics_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES public.councils(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: council_topics council_topics_groupId_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics
    ADD CONSTRAINT "council_topics_groupId_topicId_fkey" FOREIGN KEY ("groupId", "topicId") REFERENCES public.registration_groups(id, "topicId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: council_topics council_topics_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics
    ADD CONSTRAINT "council_topics_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public.lecturer_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: council_topics council_topics_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.council_topics
    ADD CONSTRAINT "council_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public.topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: councils councils_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.councils
    ADD CONSTRAINT "councils_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public.semesters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lecturer_profiles lecturer_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.lecturer_profiles
    ADD CONSTRAINT "lecturer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registration_group_members registration_group_members_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_group_members
    ADD CONSTRAINT "registration_group_members_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registration_group_members registration_group_members_groupId_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_group_members
    ADD CONSTRAINT "registration_group_members_groupId_semesterId_fkey" FOREIGN KEY ("groupId", "semesterId") REFERENCES public.registration_groups(id, "semesterId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registration_group_members registration_group_members_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_group_members
    ADD CONSTRAINT "registration_group_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_groups registration_groups_leaderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_groups
    ADD CONSTRAINT "registration_groups_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_groups registration_groups_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_groups
    ADD CONSTRAINT "registration_groups_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public.semesters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_groups registration_groups_topicId_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_groups
    ADD CONSTRAINT "registration_groups_topicId_semesterId_fkey" FOREIGN KEY ("topicId", "semesterId") REFERENCES public.topics(id, "semesterId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_rounds registration_rounds_finalisedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_rounds
    ADD CONSTRAINT "registration_rounds_finalisedById_fkey" FOREIGN KEY ("finalisedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registration_rounds registration_rounds_projectTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_rounds
    ADD CONSTRAINT "registration_rounds_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES public.project_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registration_rounds registration_rounds_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.registration_rounds
    ADD CONSTRAINT "registration_rounds_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public.semesters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: round_eligibilities round_eligibilities_roundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.round_eligibilities
    ADD CONSTRAINT "round_eligibilities_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES public.registration_rounds(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_profiles student_profiles_majorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "student_profiles_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES public.majors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_profiles student_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: submission_requirements submission_requirements_roundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submission_requirements
    ADD CONSTRAINT "submission_requirements_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES public.registration_rounds(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: submissions submissions_groupId_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_groupId_topicId_fkey" FOREIGN KEY ("groupId", "topicId") REFERENCES public.registration_groups(id, "topicId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: submissions submissions_requirementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES public.submission_requirements(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: submissions submissions_submittedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submissions submissions_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public.topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topic_proposals topic_proposals_acceptedByLecturerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT "topic_proposals_acceptedByLecturerId_fkey" FOREIGN KEY ("acceptedByLecturerId") REFERENCES public.lecturer_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: topic_proposals topic_proposals_projectTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT "topic_proposals_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES public.project_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topic_proposals topic_proposals_requestedLecturerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT "topic_proposals_requestedLecturerId_fkey" FOREIGN KEY ("requestedLecturerId") REFERENCES public.lecturer_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: topic_proposals topic_proposals_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT "topic_proposals_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public.semesters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topic_proposals topic_proposals_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topic_proposals
    ADD CONSTRAINT "topic_proposals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: topics topics_lecturerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT "topics_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES public.lecturer_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topics topics_roundId_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT "topics_roundId_semesterId_fkey" FOREIGN KEY ("roundId", "semesterId") REFERENCES public.registration_rounds(id, "semesterId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topics topics_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT "topics_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public.semesters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: topics topics_sourceProposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: probase
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT "topics_sourceProposalId_fkey" FOREIGN KEY ("sourceProposalId") REFERENCES public.topic_proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ejJS91faRofXmMWeGrbE1LFopRoLwHvF0SKql0x1ASfrsCkM9wXJFVbceCFzR7Q

