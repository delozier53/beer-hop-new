CREATE TABLE "badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"min_checkins" integer NOT NULL,
	"max_checkins" integer,
	"next_badge_at" integer,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breweries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"image" text,
	"logo" text,
	"type" text DEFAULT 'Craft Brewery' NOT NULL,
	"hours" text,
	"policies" text,
	"social_links" json DEFAULT '{}'::json NOT NULL,
	"phone" text,
	"podcast_url" text,
	"photos" json DEFAULT '[]'::json NOT NULL,
	"tap_list_url" text,
	"podcast_episode" text,
	"checkins" integer DEFAULT 0 NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0.0' NOT NULL,
	"owner_id" varchar,
	"banner_image" text,
	"banner_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"brewery_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"brewery_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"image" text NOT NULL,
	"photos" json DEFAULT '[]'::json NOT NULL,
	"ticket_required" boolean DEFAULT false NOT NULL,
	"ticket_price" numeric(8, 2),
	"attendees" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcast_episodes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_number" integer NOT NULL,
	"title" text NOT NULL,
	"guest" text NOT NULL,
	"business" text NOT NULL,
	"duration" text NOT NULL,
	"release_date" timestamp NOT NULL,
	"spotify_url" text NOT NULL,
	"image" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "special_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"event" text NOT NULL,
	"details" text NOT NULL,
	"time" text NOT NULL,
	"date" text NOT NULL,
	"address" text NOT NULL,
	"taproom" boolean DEFAULT false NOT NULL,
	"logo" text,
	"location" text,
	"rsvp_required" boolean DEFAULT false NOT NULL,
	"ticket_link" text,
	"owner_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"profile_image" text,
	"header_image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"checkins" integer DEFAULT 0 NOT NULL,
	"favorite_breweries" json DEFAULT '[]'::json NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" text NOT NULL,
	"brewery" text NOT NULL,
	"event" text NOT NULL,
	"title" text NOT NULL,
	"details" text NOT NULL,
	"time" text NOT NULL,
	"logo" text,
	"event_photo" text,
	"instagram" text,
	"twitter" text,
	"facebook" text,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
