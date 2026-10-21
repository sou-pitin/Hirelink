/*
# HireLink - Sample Data (Demo Employer, Companies, Jobs)

## Overview
Inserts sample data to populate the home page and job listings:
1. Creates a demo employer user via auth.users (triggers profile creation)
2. Creates 4 sample companies
3. Creates 8 sample jobs across those companies

## Data
- Demo employer: employer@hirelink.com (password: Demo1234!)
- Companies: TechFlow Inc, Nimbus Labs, Quantum Systems, BrightPath Studios
- Jobs: 8 jobs across those companies with various types and levels
*/

-- Create demo employer user in auth.users
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'employer@hirelink.com';
  
  IF demo_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'employer@hirelink.com', crypt('Demo1234!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"user_type":"employer","full_name":"John Smith"}'
    )
    RETURNING id INTO demo_user_id;
  END IF;
END $$;

-- Ensure profile exists
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'employer@hirelink.com';
  
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, full_name, headline, bio, location)
    VALUES (demo_user_id, 'employer@hirelink.com', 'employer', 'John Smith', 'Hiring Manager', 'Tech leader and hiring manager.', 'San Francisco, CA')
    ON CONFLICT (id) DO UPDATE SET full_name = 'John Smith', role = 'employer';
  END IF;
END $$;

-- Create sample companies
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'employer@hirelink.com';
  
  INSERT INTO companies (employer_id, name, slug, description, website, industry, company_size, location, founded_year)
  VALUES
    (demo_user_id, 'TechFlow Inc', 'techflow-inc', 'TechFlow builds cloud-native infrastructure that powers the world''s most demanding applications. We are a team of engineers, designers, and product thinkers.', 'https://techflow.example.com', 'Technology', '500-1000', 'San Francisco, CA', 2015),
    (demo_user_id, 'Nimbus Labs', 'nimbus-labs', 'Nimbus Labs is revolutionizing data infrastructure with cutting-edge analytics and AI-driven insights. Join us in building the future of data.', 'https://nimbuslabs.example.com', 'Data & AI', '200-500', 'Austin, TX', 2018),
    (demo_user_id, 'Quantum Systems', 'quantum-systems', 'Quantum Systems develops secure, scalable enterprise software for Fortune 500 companies. Our mission is to make enterprise software beautiful.', 'https://quantum.example.com', 'Enterprise Software', '1000-5000', 'New York, NY', 2010),
    (demo_user_id, 'BrightPath Studios', 'brightpath-studios', 'BrightPath Studios is a creative digital agency crafting beautiful web and mobile experiences for brands that matter.', 'https://brightpath.example.com', 'Digital Agency', '50-200', 'Portland, OR', 2016)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- Create sample jobs for TechFlow Inc
DO $$
DECLARE
  demo_user_id uuid;
  techflow_id uuid;
  nimbus_id uuid;
  quantum_id uuid;
  brightpath_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'employer@hirelink.com';
  SELECT id INTO techflow_id FROM companies WHERE slug = 'techflow-inc';
  SELECT id INTO nimbus_id FROM companies WHERE slug = 'nimbus-labs';
  SELECT id INTO quantum_id FROM companies WHERE slug = 'quantum-systems';
  SELECT id INTO brightpath_id FROM companies WHERE slug = 'brightpath-studios';

  -- TechFlow Inc jobs
  INSERT INTO jobs (company_id, employer_id, title, description, requirements, salary_min, salary_max, salary_currency, job_type, experience_level, location, is_remote, category, tags, status, featured)
  VALUES
    (techflow_id, demo_user_id, 'Senior Frontend Developer',
     'We are looking for a Senior Frontend Developer to join our growing team. You will build beautiful, performant user interfaces using React and TypeScript, working closely with our design and backend teams.',
     '5+ years of React experience\nStrong TypeScript skills\nExperience with modern build tools (Vite, Webpack)\nKnowledge of CSS-in-JS and Tailwind\nUnderstanding of accessibility standards',
     120, 160, 'USD', 'full-time', 'senior', 'San Francisco, CA', true, 'Engineering', ARRAY['React','TypeScript','Tailwind','Vite'], 'active', true),

    (techflow_id, demo_user_id, 'Backend Engineer',
     'Design and build scalable APIs and microservices using Node.js and PostgreSQL. You will be responsible for the backend infrastructure that serves millions of requests.',
     '3+ years backend experience\nNode.js and Express\nPostgreSQL expertise\nKnowledge of Docker and Kubernetes\nExperience with RESTful API design',
     110, 150, 'USD', 'full-time', 'mid', 'Remote', true, 'Engineering', ARRAY['Node.js','PostgreSQL','Docker','Kubernetes'], 'active', true),

  -- Nimbus Labs jobs
    (nimbus_id, demo_user_id, 'Data Analyst',
     'Join our analytics team to turn data into actionable insights. You will work with large datasets, build dashboards, and present findings to stakeholders.',
     '2+ years in data analysis\nSQL proficiency\nExperience with Python and Pandas\nFamiliarity with BI tools (Tableau, Looker)\nStrong communication skills',
     75, 95, 'USD', 'full-time', 'mid', 'Austin, TX', false, 'Data', ARRAY['SQL','Python','Tableau','Analytics'], 'active', false),

    (nimbus_id, demo_user_id, 'ML Engineer',
     'Build and deploy machine learning models at scale. You will work on recommendation systems, NLP, and computer vision projects.',
     'MS or PhD in CS or related field\nExperience with PyTorch or TensorFlow\nProduction ML deployment\nKnowledge of MLOps practices\n3+ years industry experience',
     140, 180, 'USD', 'full-time', 'senior', 'Remote', true, 'AI/ML', ARRAY['PyTorch','TensorFlow','MLOps','Python'], 'active', true),

  -- Quantum Systems jobs
    (quantum_id, demo_user_id, 'Product Designer',
     'Lead the design of enterprise software products. You will create wireframes, prototypes, and high-fidelity designs that delight our customers.',
     '4+ years product design experience\nProficiency in Figma\nStrong portfolio demonstrating UX thinking\nExperience with design systems\nAbility to work with cross-functional teams',
     100, 130, 'USD', 'full-time', 'senior', 'New York, NY', false, 'Design', ARRAY['Figma','UX','Design Systems','Prototyping'], 'active', true),

    (quantum_id, demo_user_id, 'DevOps Engineer',
     'Manage our cloud infrastructure and CI/CD pipelines. You will ensure reliability, security, and scalability across all our services.',
     '3+ years DevOps experience\nAWS or GCP expertise\nTerraform and Infrastructure as Code\nKubernetes and Docker\nMonitoring tools (Datadog, Prometheus)',
     115, 145, 'USD', 'full-time', 'mid', 'Remote', true, 'DevOps', ARRAY['AWS','Terraform','Kubernetes','Docker'], 'active', false),

  -- BrightPath Studios jobs
    (brightpath_id, demo_user_id, 'UX Researcher',
     'Conduct user research to inform design decisions. You will plan and execute studies, synthesize findings, and advocate for users.',
     '3+ years UX research experience\nMixed methods research skills\nExperience with tools like Maze, UserTesting\nStrong presentation skills\nAbility to translate findings to design',
     80, 110, 'USD', 'full-time', 'mid', 'Portland, OR', false, 'Design', ARRAY['UX Research','Usability Testing','User Interviews'], 'active', false),

    (brightpath_id, demo_user_id, 'Marketing Manager',
     'Drive our marketing strategy and execution. You will manage campaigns, content, and partnerships to grow our brand and client base.',
     '4+ years marketing experience\nContent marketing and SEO expertise\nSocial media management\nExperience with marketing automation tools\nStrong analytical and communication skills',
     90, 120, 'USD', 'full-time', 'senior', 'Remote', true, 'Marketing', ARRAY['SEO','Content Marketing','Analytics','Social Media'], 'active', true)
  ON CONFLICT DO NOTHING;
END $$;
