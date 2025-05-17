-- Update notifications table to match TypeScript types
-- First update existing notification types to match new constraint
UPDATE public.notifications
SET type = CASE
  WHEN type = 'task_assignment' THEN 'task_assigned'
  WHEN type IN ('comment', 'file_uploaded') THEN type
  ELSE 'task_assigned'  -- Default to task_assigned for any other values
END;

-- Now update the table structure
ALTER TABLE public.notifications
  -- Drop the time column as we use created_at
  DROP COLUMN time,
  -- Add constraints to type column
  ADD CONSTRAINT notifications_type_check CHECK (type IN ('task_assigned', 'comment', 'file_uploaded')),
  -- Make link required
  ALTER COLUMN link SET NOT NULL,
  -- Make read default to false
  ALTER COLUMN read SET DEFAULT false,
  -- Make related_user_id nullable
  ALTER COLUMN related_user_id DROP NOT NULL;

-- Add index on user_id and created_at for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx ON public.notifications(user_id, created_at DESC);

-- Add index on read status for faster queries
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy to allow service role to insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true); 