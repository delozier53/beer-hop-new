DROP TABLE "badges" CASCADE;--> statement-breakpoint
DROP TABLE "events" CASCADE;--> statement-breakpoint
DROP TABLE "global_settings" CASCADE;--> statement-breakpoint
DROP TABLE "podcast_episodes" CASCADE;--> statement-breakpoint
DROP TABLE "settings" CASCADE;--> statement-breakpoint
DROP TABLE "special_events" CASCADE;--> statement-breakpoint
DROP TABLE "weekly_events" CASCADE;--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "podcast_url";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "photos";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "tap_list_url";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "podcast_episode";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "checkins";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "rating";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "owner_id";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "banner_image";--> statement-breakpoint
ALTER TABLE "breweries" DROP COLUMN "banner_link";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "latitude";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "longitude";