
-- TABLES

-- Users table (basic, no authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id) NOT NULL,
  access_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User Answers table
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  answer_id UUID REFERENCES answers(id),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_quizzes_access_code ON quizzes(access_code);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_user_answers_attempt_id ON user_answers(attempt_id);

-- FUNCTIONS

-- Function to generate a unique access code
CREATE OR REPLACE FUNCTION generate_unique_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  access_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character code
    access_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if this code already exists
    SELECT EXISTS(SELECT 1 FROM quizzes WHERE quizzes.access_code = access_code) INTO code_exists;
    
    -- If it doesn't exist, return it
    IF NOT code_exists THEN
      RETURN access_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to automatically generate access code when creating a quiz
CREATE OR REPLACE FUNCTION set_quiz_access_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate code if it's not already provided
  IF NEW.access_code IS NULL THEN
    NEW.access_code := generate_unique_access_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Function to calculate and update quiz attempt score
CREATE OR REPLACE FUNCTION update_quiz_attempt_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  correct_count INTEGER;
  total_questions INTEGER;
BEGIN
  -- Count correct answers for this attempt
  SELECT COUNT(*) INTO correct_count
  FROM user_answers
  WHERE attempt_id = NEW.attempt_id AND is_correct = TRUE;
  
  -- Count total questions for the quiz
  SELECT COUNT(*) INTO total_questions
  FROM questions
  WHERE quiz_id = (SELECT quiz_id FROM quiz_attempts WHERE id = NEW.attempt_id);
  
  -- Update the quiz_attempt score
  UPDATE quiz_attempts
  SET score = correct_count, max_score = total_questions
  WHERE id = NEW.attempt_id;
  
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- TRIGGERS

-- Trigger to set access code before quiz insertion
CREATE TRIGGER before_quiz_insert
BEFORE INSERT ON quizzes
FOR EACH ROW
EXECUTE FUNCTION set_quiz_access_code();

-- Trigger to update quiz_attempts score when user answers
CREATE TRIGGER after_user_answer_insert
AFTER INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_quiz_attempt_score();

-- Trigger to update timestamps
CREATE TRIGGER update_quizzes_timestamp
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function to mark quiz attempt as completed
CREATE OR REPLACE FUNCTION complete_quiz_attempt(attempt_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE quiz_attempts
  SET 
    completed = TRUE,
    completed_at = CURRENT_TIMESTAMP
  WHERE id = attempt_id;
END;
$$;

-- Function to find quiz by access code
CREATE OR REPLACE FUNCTION find_quiz_by_access_code(code TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  creator_id UUID,
  access_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.title, q.description, q.creator_id, q.access_code, q.created_at
  FROM quizzes q
  WHERE q.access_code = code;
END;
$$;

-- Function to get all questions for a quiz with their answers
CREATE OR REPLACE FUNCTION get_quiz_questions(quiz_uuid UUID)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  question_type TEXT,
  order_num INTEGER,
  answers JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id as question_id,
    q.question_text,
    q.question_type,
    q.order_num,
    json_agg(
      json_build_object(
        'id', a.id,
        'answer_text', a.answer_text,
        'order_num', a.order_num
      ) ORDER BY a.order_num
    ) as answers
  FROM questions q
  JOIN answers a ON q.id = a.question_id
  WHERE q.quiz_id = quiz_uuid
  GROUP BY q.id, q.question_text, q.question_type, q.order_num
  ORDER BY q.order_num;
END;
$$;

-- Function to get quiz results
CREATE OR REPLACE FUNCTION get_quiz_results(attempt_uuid UUID)
RETURNS TABLE (
  attempt_id UUID,
  quiz_id UUID,
  quiz_title TEXT,
  user_id UUID,
  user_name TEXT,
  score INTEGER,
  max_score INTEGER,
  percentage NUMERIC,
  completed BOOLEAN,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  question_results JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id as attempt_id,
    qa.quiz_id,
    q.title as quiz_title,
    qa.user_id,
    u.name as user_name,
    qa.score,
    qa.max_score,
    CASE 
      WHEN qa.max_score > 0 THEN (qa.score::NUMERIC / qa.max_score) * 100
      ELSE 0
    END as percentage,
    qa.completed,
    qa.started_at,
    qa.completed_at,
    (
      SELECT json_agg(
        json_build_object(
          'question_id', qst.id,
          'question_text', qst.question_text,
          'user_answer', ans.answer_text,
          'is_correct', ua.is_correct,
          'correct_answer', (
            SELECT a.answer_text 
            FROM answers a 
            WHERE a.question_id = qst.id AND a.is_correct = TRUE 
            LIMIT 1
          )
        )
      )
      FROM user_answers ua
      JOIN questions qst ON ua.question_id = qst.id
      LEFT JOIN answers ans ON ua.answer_id = ans.id
      WHERE ua.attempt_id = qa.id
    ) as question_results
  FROM quiz_attempts qa
  JOIN quizzes q ON qa.quiz_id = q.id
  JOIN users u ON qa.user_id = u.id
  WHERE qa.id = attempt_uuid;
END;
$$;
