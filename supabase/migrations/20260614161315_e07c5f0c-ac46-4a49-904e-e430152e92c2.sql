CREATE POLICY "avatars_select_all" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_all" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update_all" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_delete_all" ON storage.objects FOR DELETE TO public USING (bucket_id = 'avatars');