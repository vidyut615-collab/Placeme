-- Migration to add new stages to application_status enum for the Application Management System

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'screened';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'ppt';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'stage1';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'stage2';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'stage3';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'dropped';
