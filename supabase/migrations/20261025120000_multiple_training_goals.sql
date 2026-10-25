-- Preserve every selection alongside the existing prescription/review focus.
-- Null keeps legacy clients and existing goal history readable.
ALTER TABLE public.training_goals ADD COLUMN selected_goals text
  CONSTRAINT training_goals_selected_valid CHECK (
    selected_goals IS NULL OR (
      jsonb_typeof(selected_goals::jsonb) = 'array'
      AND jsonb_array_length(selected_goals::jsonb) BETWEEN 1 AND 4
      AND selected_goals::jsonb <@ '["lose_fat", "build_muscle", "recomp", "get_stronger"]'::jsonb
    )
  );
