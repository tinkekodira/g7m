-- An account preference, independent of experience and training goal.
-- Null distinguishes an unanswered onboarding question from either choice.
-- Existing onboarded accounts keep recommendations until they opt out.
ALTER TABLE public.profiles ADD COLUMN workout_recommendations boolean;
