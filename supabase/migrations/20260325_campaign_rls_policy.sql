-- Enable RLS on campaign table
ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view campaigns belonging to their company
CREATE POLICY "campaign_select_policy"
ON public.campaign
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.app_user 
    WHERE app_user.company_id = campaign.company_id 
    AND app_user.user_id = auth.uid()
  )
);

-- Policy: Users can insert campaigns for their company
CREATE POLICY "campaign_insert_policy"
ON public.campaign
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_user 
    WHERE app_user.company_id = campaign.company_id 
    AND app_user.user_id = auth.uid()
  )
);

-- Policy: Users can update campaigns belonging to their company
CREATE POLICY "campaign_update_policy"
ON public.campaign
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.app_user 
    WHERE app_user.company_id = campaign.company_id 
    AND app_user.user_id = auth.uid()
  )
);

-- Policy: Users can delete campaigns belonging to their company
CREATE POLICY "campaign_delete_policy"
ON public.campaign
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.app_user 
    WHERE app_user.company_id = campaign.company_id 
    AND app_user.user_id = auth.uid()
  )
);
