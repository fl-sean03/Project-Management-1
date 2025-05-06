-- Insert initial users
INSERT INTO public.users (id, name, email, avatar, role, team, phone, department, location, joined_date, bio)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex@example.com', '/avatars/avatar-1.jpg', 'Product Manager', 'Core Product', '+1 (555) 123-4567', 'Product', 'San Francisco, CA', '2023-01-15', 'Experienced product manager with a passion for user-centered design and agile methodologies.'),
  ('00000000-0000-0000-0000-000000000002', 'Sarah Chen', 'sarah@example.com', '/avatars/avatar-2.jpg', 'UX Designer', 'Design', '+1 (555) 234-5678', 'Design', 'New York, NY', '2023-03-10', 'Creative designer focused on creating intuitive and beautiful user experiences.'),
  ('00000000-0000-0000-0000-000000000003', 'Miguel Rodriguez', 'miguel@example.com', '/avatars/avatar-3.jpg', 'Frontend Developer', 'Engineering', '+1 (555) 345-6789', 'Engineering', 'Austin, TX', '2023-02-05', 'Frontend developer specializing in React and modern JavaScript frameworks.'),
  ('00000000-0000-0000-0000-000000000004', 'Priya Patel', 'priya@example.com', '/avatars/avatar-4.jpg', 'Backend Developer', 'Engineering', '+1 (555) 456-7890', 'Engineering', 'Seattle, WA', '2023-04-20', 'Backend developer with expertise in API design, databases, and cloud infrastructure.'),
  ('00000000-0000-0000-0000-000000000005', 'David Kim', 'david@example.com', '/avatars/avatar-5.jpg', 'Marketing Manager', 'Marketing', '+1 (555) 567-8901', 'Marketing', 'Chicago, IL', '2023-01-30', 'Marketing professional with experience in digital campaigns, content strategy, and brand development.');

-- Insert initial projects
INSERT INTO public.projects (id, name, description, status, progress, due_date, priority, category, created_at, start_date, budget, client, owner_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Website Redesign', 'Redesign the company website with a focus on improving user experience, increasing conversion rates, and implementing modern design principles.', 'In Progress', 60, '2025-06-30', 'High', 'Design', '2025-01-15', '2025-02-01', 50000, 'Internal', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'Mobile App Development', 'Build a new mobile app for customer engagement with features including user profiles, activity tracking, and personalized recommendations.', 'In Progress', 40, '2025-08-30', 'High', 'Development', '2025-02-05', '2025-03-01', 120000, 'Internal', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'Q2 Marketing Campaign', 'Plan and execute Q2 marketing initiatives focused on increasing brand awareness and driving user acquisition through multiple channels.', 'Planning', 15, '2025-07-01', 'Medium', 'Marketing', '2025-03-20', '2025-04-01', 75000, 'Internal', '00000000-0000-0000-0000-000000000005');

-- Insert project members
INSERT INTO public.project_members (project_id, user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'member'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'member'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'member'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'owner'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'member'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'member');

-- Insert tasks
INSERT INTO public.tasks (id, title, description, status, priority, due_date, assignee_id, project_id, estimated_hours, created_at, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Create wireframes for homepage', 'Design initial wireframes for the homepage based on user research and stakeholder feedback.', 'Completed', 'High', '2025-02-15', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 8, '2025-01-20', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'Develop responsive navigation', 'Implement responsive navigation menu that works well on all device sizes.', 'In Progress', 'Medium', '2025-03-01', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 12, '2025-02-10', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'Content migration plan', 'Create a plan for migrating existing content to the new website structure.', 'To Do', 'Medium', '2025-03-15', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 6, '2025-02-20', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'Design app onboarding flow', 'Create a user-friendly onboarding experience for new app users.', 'In Progress', 'High', '2025-03-20', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 10, '2025-02-15', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', 'Implement user authentication', 'Set up secure user authentication system with social login options.', 'To Do', 'High', '2025-04-01', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 20, '2025-03-01', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', 'Develop target audience personas', 'Research and define detailed personas for our Q2 campaign target audiences.', 'In Progress', 'Medium', '2025-04-10', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 8, '2025-03-25', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000007', 'Create campaign landing page', 'Design and develop the landing page for the Q2 marketing campaign.', 'To Do', 'Medium', '2025-04-20', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 15, '2025-03-30', '00000000-0000-0000-0000-000000000005');

-- Insert comments
INSERT INTO public.comments (task_id, user_id, content, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Let''s make sure we focus on simplicity and clarity in these wireframes.', '2025-01-21'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'I''ve completed the initial wireframes. Please review and provide feedback.', '2025-02-10'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'The onboarding should include no more than 3 screens to avoid overwhelming new users.', '2025-02-16'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'I''ve started sketching some ideas. Will share progress tomorrow.', '2025-02-17');

-- Insert activities
INSERT INTO public.activities (user_id, action, target, target_id, target_name, project_id, time, content)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'created', 'project', '00000000-0000-0000-0000-000000000001', 'Website Redesign', '00000000-0000-0000-0000-000000000001', '2025-01-15', NULL),
  ('00000000-0000-0000-0000-000000000001', 'created', 'task', '00000000-0000-0000-0000-000000000001', 'Create wireframes for homepage', '00000000-0000-0000-0000-000000000001', '2025-01-20', NULL),
  ('00000000-0000-0000-0000-000000000002', 'updated', 'task', '00000000-0000-0000-0000-000000000001', 'Create wireframes for homepage', '00000000-0000-0000-0000-000000000001', '2025-02-10', 'Changed status to Completed'),
  ('00000000-0000-0000-0000-000000000001', 'created', 'project', '00000000-0000-0000-0000-000000000002', 'Mobile App Development', '00000000-0000-0000-0000-000000000002', '2025-02-05', NULL),
  ('00000000-0000-0000-0000-000000000005', 'created', 'project', '00000000-0000-0000-0000-000000000003', 'Q2 Marketing Campaign', '00000000-0000-0000-0000-000000000003', '2025-03-20', NULL); 