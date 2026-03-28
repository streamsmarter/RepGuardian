-- Enable RLS on campaign_recipient table
ALTER TABLE public.campaign_recipient ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "campaign_recipient_select_policy" ON public.campaign_recipient;
DROP POLICY IF EXISTS "campaign_recipient_insert_policy" ON public.campaign_recipient;
DROP POLICY IF EXISTS "campaign_recipient_update_policy" ON public.campaign_recipient;
DROP POLICY IF EXISTS "campaign_recipient_delete_policy" ON public.campaign_recipient;

-- Create SELECT policy: Users can view campaign_recipients for campaigns belonging to their company
CREATE POLICY "campaign_recipient_select_policy"
ON public.campaign_recipient
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.app_user au ON au.company_id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND au.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.company co ON co.id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND co.user_id = auth.uid()
  )
);

-- Create INSERT policy
CREATE POLICY "campaign_recipient_insert_policy"
ON public.campaign_recipient
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.app_user au ON au.company_id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND au.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.company co ON co.id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND co.user_id = auth.uid()
  )
);

-- Create UPDATE policy
CREATE POLICY "campaign_recipient_update_policy"
ON public.campaign_recipient
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.app_user au ON au.company_id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND au.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.company co ON co.id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND co.user_id = auth.uid()
  )
);

-- Create DELETE policy
CREATE POLICY "campaign_recipient_delete_policy"
ON public.campaign_recipient
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.app_user au ON au.company_id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND au.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.campaign c
    JOIN public.company co ON co.id = c.company_id
    WHERE c.id = campaign_recipient.campaign_id 
    AND co.user_id = auth.uid()
  )
);
