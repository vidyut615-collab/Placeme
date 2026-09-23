-- Migration: Cascade Academic Renames
-- Function to automatically cascade renames of academic fields (department, type, year)
-- across all students, pending audit requests, jobs, and placement policies of a college.

CREATE OR REPLACE FUNCTION cascade_rename_academic_field(
  p_college_id UUID,
  p_field TEXT,
  p_old_val TEXT,
  p_new_val TEXT
) RETURNS JSONB AS $$
DECLARE
  v_student_count INTEGER := 0;
  v_request_count INTEGER := 0;
  v_job_count INTEGER := 0;
BEGIN
  -- 1. Update students.profile_data (department, type, or year)
  UPDATE students
  SET profile_data = jsonb_set(
    COALESCE(profile_data, '{}'::jsonb), 
    ARRAY[p_field], 
    to_jsonb(p_new_val), 
    false
  )
  WHERE college_id = p_college_id
    AND profile_data->>p_field = p_old_val;
    
  GET DIAGNOSTICS v_student_count = ROW_COUNT;

  -- 2. Update pending profile_update_requests
  UPDATE profile_update_requests
  SET proposed_profile_data = jsonb_set(
    COALESCE(proposed_profile_data, '{}'::jsonb), 
    ARRAY[p_field], 
    to_jsonb(p_new_val), 
    false
  )
  WHERE college_id = p_college_id
    AND status = 'pending'
    AND proposed_profile_data->>p_field = p_old_val;

  GET DIAGNOSTICS v_request_count = ROW_COUNT;

  -- 3. Update jobs eligibility_criteria if it's department
  IF p_field = 'department' THEN
    UPDATE jobs
    SET eligibility_criteria = jsonb_set(
      eligibility_criteria,
      '{allowed_departments}',
      (
        SELECT COALESCE(
          jsonb_agg(
            CASE 
              WHEN elem #>> '{}' = p_old_val THEN to_jsonb(p_new_val) 
              ELSE elem 
            END
          ), 
          '[]'::jsonb
        )
        FROM jsonb_array_elements(eligibility_criteria->'allowed_departments') AS elem
      )
    )
    WHERE college_id = p_college_id
      AND eligibility_criteria->'allowed_departments' @> to_jsonb(ARRAY[p_old_val]);
      
    GET DIAGNOSTICS v_job_count = ROW_COUNT;
  END IF;

  -- 4. Update placement_policies if present
  IF p_field = 'department' THEN
    UPDATE placement_policies
    SET config = jsonb_set(
      config,
      '{eligibility,allowed_departments}',
      (
        SELECT COALESCE(
          jsonb_agg(
            CASE 
              WHEN elem #>> '{}' = p_old_val THEN to_jsonb(p_new_val) 
              ELSE elem 
            END
          ), 
          '[]'::jsonb
        )
        FROM jsonb_array_elements(config->'eligibility'->'allowed_departments') AS elem
      )
    )
    WHERE college_id = p_college_id
      AND config->'eligibility'->'allowed_departments' @> to_jsonb(ARRAY[p_old_val]);
  ELSIF p_field = 'type' THEN
    UPDATE placement_policies
    SET config = jsonb_set(
      config,
      '{eligibility,allowed_types}',
      (
        SELECT COALESCE(
          jsonb_agg(
            CASE 
              WHEN elem #>> '{}' = p_old_val THEN to_jsonb(p_new_val) 
              ELSE elem 
            END
          ), 
          '[]'::jsonb
        )
        FROM jsonb_array_elements(config->'eligibility'->'allowed_types') AS elem
      )
    )
    WHERE college_id = p_college_id
      AND config->'eligibility'->'allowed_types' @> to_jsonb(ARRAY[p_old_val]);
  ELSIF p_field = 'year' THEN
    UPDATE placement_policies
    SET config = jsonb_set(
      config,
      '{eligibility,allowed_years}',
      (
        SELECT COALESCE(
          jsonb_agg(
            CASE 
              WHEN elem #>> '{}' = p_old_val THEN to_jsonb(p_new_val) 
              ELSE elem 
            END
          ), 
          '[]'::jsonb
        )
        FROM jsonb_array_elements(config->'eligibility'->'allowed_years') AS elem
      )
    )
    WHERE college_id = p_college_id
      AND config->'eligibility'->'allowed_years' @> to_jsonb(ARRAY[p_old_val]);
  END IF;

  RETURN jsonb_build_object(
    'students_updated', v_student_count,
    'requests_updated', v_request_count,
    'jobs_updated', v_job_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
