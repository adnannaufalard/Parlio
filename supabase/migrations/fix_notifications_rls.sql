-- Migration to fix user_notifications RLS policies

-- Allow anyone to insert notifications (teachers to students, system to users, etc.)
CREATE POLICY "Anyone can insert notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own notifications (to mark as read)
CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
