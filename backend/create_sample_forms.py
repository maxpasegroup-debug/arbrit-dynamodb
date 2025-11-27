"""
Create sample Assessment and Feedback forms
Phase 2: Create sample forms for testing
"""
import boto3
import os
from uuid import uuid4
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

def create_sample_forms():
    """Create sample assessment and feedback forms"""
    try:
        dynamodb = boto3.resource('dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        forms_table = dynamodb.Table('arbrit_workdesk_assessment_forms')
        users_table = dynamodb.Table('arbrit_workdesk_users')
        
        # Get Academic Head user
        users_response = users_table.scan()
        academic_head = None
        for user in users_response['Items']:
            if user.get('role') == 'Academic Head':
                academic_head = user
                break
        
        if not academic_head:
            print("❌ Academic Head user not found")
            return False
        
        print("=" * 80)
        print("Creating Sample Assessment & Feedback Forms")
        print("=" * 80)
        
        # Form 1: Training Feedback Form
        feedback_form_id = str(uuid4())
        feedback_form = {
            "id": feedback_form_id,
            "title": "Training Feedback Form",
            "description": "Please provide your feedback on the training session to help us improve",
            "course_name": "Safety Training Course",
            "batch_name": "Batch 2025-A",
            "trainer_id": "",
            "trainer_name": "",
            "session_date": "",
            "branch": "Dubai",
            "status": "active",
            "created_by": academic_head.get('id'),
            "created_by_name": academic_head.get('name'),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "qr_code_url": f"/public/assessment/{feedback_form_id}",
            "questions": [
                {
                    "id": "q1",
                    "question_text": "How would you rate the overall quality of the training?",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q2",
                    "question_text": "The trainer was knowledgeable about the subject",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q3",
                    "question_text": "The trainer communicated clearly and effectively",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q4",
                    "question_text": "The training materials were well-organized",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q5",
                    "question_text": "The training venue was comfortable",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q6",
                    "question_text": "What did you like most about the training?",
                    "question_type": "text",
                    "options": None,
                    "required": False
                },
                {
                    "id": "q7",
                    "question_text": "What areas could be improved?",
                    "question_type": "text",
                    "options": None,
                    "required": False
                },
                {
                    "id": "q8",
                    "question_text": "Would you recommend this training to others?",
                    "question_type": "yes_no",
                    "options": None,
                    "required": True
                }
            ]
        }
        
        forms_table.put_item(Item=feedback_form)
        print(f"\\n✅ Created: {feedback_form['title']}")
        print(f"   ID: {feedback_form_id}")
        print(f"   Questions: {len(feedback_form['questions'])}")
        print(f"   QR URL: {feedback_form['qr_code_url']}")
        
        # Form 2: Course Assessment Form
        assessment_form_id = str(uuid4())
        assessment_form = {
            "id": assessment_form_id,
            "title": "Course Assessment Form",
            "description": "Evaluate your understanding of the course material",
            "course_name": "Fire Safety & Emergency Response",
            "batch_name": "Batch 2025-B",
            "trainer_id": "",
            "trainer_name": "",
            "session_date": "",
            "branch": "Dubai",
            "status": "active",
            "created_by": academic_head.get('id'),
            "created_by_name": academic_head.get('name'),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "qr_code_url": f"/public/assessment/{assessment_form_id}",
            "questions": [
                {
                    "id": "q1",
                    "question_text": "I understand the key safety protocols covered in this training",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q2",
                    "question_text": "I can identify different types of fire extinguishers",
                    "question_type": "yes_no",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q3",
                    "question_text": "The practical demonstrations were helpful",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q4",
                    "question_text": "Which emergency procedure is most important?",
                    "question_type": "multiple_choice",
                    "options": ["Evacuation", "First Aid", "Fire Fighting", "All of the above"],
                    "required": True
                },
                {
                    "id": "q5",
                    "question_text": "I feel confident applying what I learned in a real emergency",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q6",
                    "question_text": "Additional topics you would like to learn",
                    "question_type": "text",
                    "options": None,
                    "required": False
                }
            ]
        }
        
        forms_table.put_item(Item=assessment_form)
        print(f"\\n✅ Created: {assessment_form['title']}")
        print(f"   ID: {assessment_form_id}")
        print(f"   Questions: {len(assessment_form['questions'])}")
        print(f"   QR URL: {assessment_form['qr_code_url']}")
        
        # Form 3: Quick Trainer Evaluation
        quick_eval_id = str(uuid4())
        quick_eval = {
            "id": quick_eval_id,
            "title": "Quick Trainer Evaluation",
            "description": "Brief evaluation of trainer performance",
            "course_name": "",
            "batch_name": "",
            "trainer_id": "",
            "trainer_name": "",
            "session_date": "",
            "branch": "Dubai",
            "status": "active",
            "created_by": academic_head.get('id'),
            "created_by_name": academic_head.get('name'),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "qr_code_url": f"/public/assessment/{quick_eval_id}",
            "questions": [
                {
                    "id": "q1",
                    "question_text": "Trainer's knowledge of subject",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q2",
                    "question_text": "Trainer's communication skills",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q3",
                    "question_text": "Trainer's engagement with students",
                    "question_type": "rating",
                    "options": None,
                    "required": True
                },
                {
                    "id": "q4",
                    "question_text": "Additional comments",
                    "question_type": "text",
                    "options": None,
                    "required": False
                }
            ]
        }
        
        forms_table.put_item(Item=quick_eval)
        print(f"\\n✅ Created: {quick_eval['title']}")
        print(f"   ID: {quick_eval_id}")
        print(f"   Questions: {len(quick_eval['questions'])}")
        
        print("\\n" + "=" * 80)
        print("✅ Successfully created 3 sample forms!")
        print("=" * 80)
        print("\\nThese forms are now available to:")
        print("  - Academic Head: View, Edit, Delete, Generate QR")
        print("  - Trainers: Generate QR codes for their sessions")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_sample_forms()
    exit(0 if success else 1)
