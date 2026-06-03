create policy "Published pages are publicly readable"
on projects for select
to anon
using (published = true);
