ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES public.users(id);

CREATE POLICY "Allow update access on notes" ON public.notes
  FOR UPDATE TO authenticated USING (true);