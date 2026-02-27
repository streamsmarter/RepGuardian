-- Enable RLS on review table
ALTER TABLE review ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reviews belonging to their company
CREATE POLICY "Users can view their company reviews"
ON review
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM app_user 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert reviews for their company
CREATE POLICY "Users can insert reviews for their company"
ON review
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM app_user 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update reviews belonging to their company
CREATE POLICY "Users can update their company reviews"
ON review
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM app_user 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete reviews belonging to their company
CREATE POLICY "Users can delete their company reviews"
ON review
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM app_user 
    WHERE user_id = auth.uid()
  )
);
