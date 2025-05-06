-- Update Project Progress Function
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INT;
  completed_tasks INT;
  new_progress INT;
BEGIN
  -- Count total and completed tasks
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE status = 'Completed')
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE project_id = NEW.project_id;
  
  -- Calculate new progress percentage
  IF total_tasks > 0 THEN
    new_progress := (completed_tasks * 100) / total_tasks;
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the project progress
  UPDATE public.projects
  SET progress = new_progress,
      updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task status changes
CREATE TRIGGER update_project_progress_trigger
AFTER INSERT OR UPDATE OF status OR DELETE
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

-- Create Activity Log Function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  target_name TEXT;
  project_id UUID;
BEGIN
  -- Determine the target name and project ID based on the table
  IF TG_TABLE_NAME = 'tasks' THEN
    target_name := NEW.title;
    project_id := NEW.project_id;
  ELSIF TG_TABLE_NAME = 'projects' THEN
    target_name := NEW.name;
    project_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'files' THEN
    target_name := NEW.name;
    project_id := NEW.project_id;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    SELECT title, project_id INTO target_name, project_id
    FROM public.tasks WHERE id = NEW.task_id;
  END IF;
  
  -- Determine the action
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (
      user_id, action, target, target_id, target_name, project_id
    ) VALUES (
      auth.uid(), 'created', TG_TABLE_NAME, NEW.id, target_name, project_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activities (
      user_id, action, target, target_id, target_name, project_id
    ) VALUES (
      auth.uid(), 'updated', TG_TABLE_NAME, NEW.id, target_name, project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER log_task_activity
AFTER INSERT OR UPDATE
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_project_activity
AFTER INSERT OR UPDATE
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_file_activity
AFTER INSERT
ON public.files
FOR EACH ROW
EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_comment_activity
AFTER INSERT
ON public.comments
FOR EACH ROW
EXECUTE FUNCTION log_activity();

-- Create Notification Function
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  notification_content TEXT;
  notification_link TEXT;
  related_user_id UUID;
BEGIN
  -- Set default values
  related_user_id := NULL;
  
  -- Determine notification type and content based on the table and operation
  IF TG_TABLE_NAME = 'tasks' AND TG_OP = 'UPDATE' AND NEW.assignee_id != OLD.assignee_id THEN
    -- Task assignment notification
    notification_type := 'assignment';
    notification_content := 'You were assigned to "' || NEW.title || '"';
    notification_link := '/tasks/' || NEW.id;
    
    -- Insert notification for the assignee
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        type, content, link, user_id, related_user_id
      ) VALUES (
        notification_type, notification_content, notification_link, NEW.assignee_id, auth.uid()
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT' THEN
    -- Comment notification
    notification_type := 'comment';
    
    -- Get task details
    DECLARE
      task_title TEXT;
      task_assignee_id UUID;
      task_creator_id UUID;
    BEGIN
      SELECT title, assignee_id, created_by 
      INTO task_title, task_assignee_id, task_creator_id
      FROM public.tasks WHERE id = NEW.task_id;
      
      notification_content := (SELECT name FROM public.users WHERE id = NEW.user_id) || 
                             ' commented on "' || task_title || '"';
      notification_link := '/tasks/' || NEW.task_id;
      
      -- Notify task assignee if not the commenter
      IF task_assignee_id IS NOT NULL AND task_assignee_id != NEW.user_id THEN
        INSERT INTO public.notifications (
          type, content, link, user_id, related_user_id
        ) VALUES (
          notification_type, notification_content, notification_link, task_assignee_id, NEW.user_id
        );
      END IF;
      
      -- Notify task creator if not the commenter and not the assignee
      IF task_creator_id != NEW.user_id AND task_creator_id != task_assignee_id THEN
        INSERT INTO public.notifications (
          type, content, link, user_id, related_user_id
        ) VALUES (
          notification_type, notification_content, notification_link, task_creator_id, NEW.user_id
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER task_assignment_notification
AFTER UPDATE
ON public.tasks
FOR EACH ROW
WHEN (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id)
EXECUTE FUNCTION create_notification();

CREATE TRIGGER comment_notification
AFTER INSERT
ON public.comments
FOR EACH ROW
EXECUTE FUNCTION create_notification(); 