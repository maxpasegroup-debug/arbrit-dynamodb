#!/usr/bin/env python3
"""
Populate Academic Library with comprehensive demo data
"""

import boto3
from datetime import datetime
from uuid import uuid4
import os

# Initialize DynamoDB with environment credentials
dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

folders_table = dynamodb.Table('arbrit_workdesk_academic_library_folders')
documents_table = dynamodb.Table('arbrit_workdesk_academic_library_documents')

def create_demo_data():
    """Create comprehensive demo data for Academic Library"""
    
    print("🚀 Starting Academic Library Demo Data Population...")
    
    # Define demo folders structure
    folders_data = [
        {
            'id': str(uuid4()),
            'name': 'Safety Training Materials',
            'parent_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': 'Academic Head',
            'document_count': 0,
            'description': 'Core safety training materials and resources'
        },
        {
            'id': str(uuid4()),
            'name': 'First Aid & Emergency Response',
            'parent_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': 'Academic Head',
            'document_count': 0,
            'description': 'First aid procedures and emergency protocols'
        },
        {
            'id': str(uuid4()),
            'name': 'Fire Safety & Prevention',
            'parent_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': 'Academic Head',
            'document_count': 0,
            'description': 'Fire safety guidelines and prevention measures'
        },
        {
            'id': str(uuid4()),
            'name': 'Construction Safety',
            'parent_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': 'Academic Head',
            'document_count': 0,
            'description': 'Construction site safety protocols and guidelines'
        },
        {
            'id': str(uuid4()),
            'name': 'Trainer Resources',
            'parent_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': 'Academic Head',
            'document_count': 0,
            'description': 'Training materials and instructor guides'
        }
    ]
    
    # Insert folders
    print("\n📁 Creating folders...")
    for folder in folders_data:
        folders_table.put_item(Item=folder)
        print(f"  ✅ Created folder: {folder['name']}")
    
    # Define demo documents with realistic file paths
    documents_data = [
        # Safety Training Materials
        {
            'id': str(uuid4()),
            'name': 'OSHA Safety Standards Guide.pdf',
            'folder_id': folders_data[0]['id'],
            'file_path': 'https://example.com/docs/osha-standards.pdf',
            'file_type': 'application/pdf',
            'size': 2457600,  # ~2.4 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Comprehensive OSHA safety standards and regulations',
            'version': '1.0'
        },
        {
            'id': str(uuid4()),
            'name': 'Workplace Hazard Identification.pptx',
            'folder_id': folders_data[0]['folder_id'],
            'file_path': 'https://example.com/docs/hazard-identification.pptx',
            'file_type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'size': 5242880,  # 5 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Training presentation on identifying workplace hazards',
            'version': '2.1'
        },
        {
            'id': str(uuid4()),
            'name': 'Safety Equipment Checklist.xlsx',
            'folder_id': folders_data[0]['folder_id'],
            'file_path': 'https://example.com/docs/safety-equipment.xlsx',
            'file_type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size': 102400,  # 100 KB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Checklist for required safety equipment',
            'version': '1.5'
        },
        
        # First Aid & Emergency Response
        {
            'id': str(uuid4()),
            'name': 'CPR Training Manual.pdf',
            'folder_id': folders_data[1]['folder_id'],
            'file_path': 'https://example.com/docs/cpr-manual.pdf',
            'file_type': 'application/pdf',
            'size': 3145728,  # 3 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Step-by-step CPR procedures and best practices',
            'version': '3.0'
        },
        {
            'id': str(uuid4()),
            'name': 'Emergency Response Plan Template.docx',
            'folder_id': folders_data[1]['folder_id'],
            'file_path': 'https://example.com/docs/emergency-response.docx',
            'file_type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'size': 512000,  # 500 KB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Template for creating emergency response plans',
            'version': '1.2'
        },
        {
            'id': str(uuid4()),
            'name': 'First Aid Kit Contents Guide.pdf',
            'folder_id': folders_data[1]['folder_id'],
            'file_path': 'https://example.com/docs/first-aid-kit.pdf',
            'file_type': 'application/pdf',
            'size': 819200,  # 800 KB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Required contents for workplace first aid kits',
            'version': '2.0'
        },
        
        # Fire Safety & Prevention
        {
            'id': str(uuid4()),
            'name': 'Fire Extinguisher Types and Usage.pdf',
            'folder_id': folders_data[2]['folder_id'],
            'file_path': 'https://example.com/docs/fire-extinguisher.pdf',
            'file_type': 'application/pdf',
            'size': 1572864,  # 1.5 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Guide to different fire extinguisher types and proper usage',
            'version': '1.8'
        },
        {
            'id': str(uuid4()),
            'name': 'Fire Evacuation Procedures.pptx',
            'folder_id': folders_data[2]['folder_id'],
            'file_path': 'https://example.com/docs/fire-evacuation.pptx',
            'file_type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'size': 4194304,  # 4 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Step-by-step evacuation procedures for fire emergencies',
            'version': '2.3'
        },
        
        # Construction Safety
        {
            'id': str(uuid4()),
            'name': 'Scaffolding Safety Standards.pdf',
            'folder_id': folders_data[3]['folder_id'],
            'file_path': 'https://example.com/docs/scaffolding-safety.pdf',
            'file_type': 'application/pdf',
            'size': 2097152,  # 2 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Safety standards for scaffolding erection and use',
            'version': '1.4'
        },
        {
            'id': str(uuid4()),
            'name': 'Fall Protection Guidelines.pdf',
            'folder_id': folders_data[3]['folder_id'],
            'file_path': 'https://example.com/docs/fall-protection.pdf',
            'file_type': 'application/pdf',
            'size': 1835008,  # 1.75 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Comprehensive fall protection and prevention guidelines',
            'version': '2.0'
        },
        {
            'id': str(uuid4()),
            'name': 'Heavy Equipment Operation Safety.pptx',
            'folder_id': folders_data[3]['folder_id'],
            'file_path': 'https://example.com/docs/equipment-safety.pptx',
            'file_type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'size': 6291456,  # 6 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Safety protocols for operating heavy construction equipment',
            'version': '1.9'
        },
        
        # Trainer Resources
        {
            'id': str(uuid4()),
            'name': 'Effective Training Techniques.pdf',
            'folder_id': folders_data[4]['folder_id'],
            'file_path': 'https://example.com/docs/training-techniques.pdf',
            'file_type': 'application/pdf',
            'size': 1310720,  # 1.25 MB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Best practices for effective safety training delivery',
            'version': '1.6'
        },
        {
            'id': str(uuid4()),
            'name': 'Assessment and Evaluation Forms.xlsx',
            'folder_id': folders_data[4]['folder_id'],
            'file_path': 'https://example.com/docs/assessment-forms.xlsx',
            'file_type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size': 204800,  # 200 KB
            'created_by': 'Academic Head',
            'created_at': datetime.utcnow().isoformat(),
            'description': 'Templates for trainee assessment and evaluation',
            'version': '1.3'
        }
    ]
    
    # Insert documents
    print("\n📄 Creating documents...")
    for doc in documents_data:
        documents_table.put_item(Item=doc)
        print(f"  ✅ Created document: {doc['name']} in folder")
        
        # Update folder document count
        folder_id = doc['folder_id']
        folder = next((f for f in folders_data if f['folder_id'] == folder_id), None)
        if folder:
            folder['document_count'] += 1
    
    # Update folder document counts
    print("\n🔄 Updating folder document counts...")
    for folder in folders_data:
        folders_table.update_item(
            Key={'id': folder['id']},
            UpdateExpression='SET document_count = :count',
            ExpressionAttributeValues={':count': folder['document_count']}
        )
        print(f"  ✅ Updated {folder['name']}: {folder['document_count']} documents")
    
    # Display summary
    print("\n" + "="*60)
    print("✅ ACADEMIC LIBRARY DEMO DATA POPULATED SUCCESSFULLY!")
    print("="*60)
    print(f"\n📊 Summary:")
    print(f"  📁 Folders created: {len(folders_data)}")
    print(f"  📄 Documents created: {len(documents_data)}")
    print(f"\n📂 Folder Structure:")
    for folder in folders_data:
        print(f"  • {folder['name']} ({folder['document_count']} documents)")
    
    print("\n🎯 Next Steps:")
    print("  1. Login as Academic Head to view the library")
    print("  2. Verify folders and documents are displayed correctly")
    print("  3. Login as Trainer to access assigned materials")
    print("  4. Test document download functionality")
    print("\n✨ Demo data is ready for testing!\n")

if __name__ == '__main__':
    try:
        create_demo_data()
    except Exception as e:
        print(f"\n❌ Error creating demo data: {e}")
        raise
