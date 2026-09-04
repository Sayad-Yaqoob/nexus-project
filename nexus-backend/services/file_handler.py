import os
import uuid
from typing import Tuple, Dict, Any, Optional
from config import settings

class FileHandler:
    """Handles validation and storage of digital product file placeholders."""

    OFFER_TYPE_FILE_RULES: Dict[str, Dict[str, Any]] = {
        '1:1 Session': {'required': False, 'allowed_types': []},
        'Subscription': {'required': False, 'allowed_types': []},
        'Digital Product': {
            'required': True, 
            'allowed_types': ['pdf', 'zip', 'xlsx', 'pptx', 'docx', 'csv'], 
            'max_size_mb': 50
        },
        'Custom Offer': {'required': False, 'allowed_types': []},
        'Book': {
            'required': True, 
            'allowed_types': ['pdf'], 
            'max_size_mb': 80
        },
        'Highlight': {'required': False, 'allowed_types': ['png', 'jpg']},
    }

    def is_file_required(self, offer_type: str, context: Optional[dict] = None) -> bool:
        """Returns True if the specified offer_type requires a mandatory file upload."""
        rule = self.OFFER_TYPE_FILE_RULES.get(offer_type, {'required': False})
        return rule.get('required', False)

    def validate_placeholder(self, offer_type: str, file_path: Optional[str]) -> Tuple[bool, str]:
        """
        Validates whether an offering satisfies file upload rules.
        Returns (is_valid, error_message).
        """
        required = self.is_file_required(offer_type)
        
        if not required:
            return True, ""

        if not file_path or not file_path.strip():
            rule = self.OFFER_TYPE_FILE_RULES.get(offer_type, {})
            allowed = ", ".join(rule.get('allowed_types', []))
            return False, f"Offer type '{offer_type}' requires a file attachment ({allowed}). Please upload a file."

        # Verify extension if file_path is provided
        ext = file_path.split('.')[-1].lower() if '.' in file_path else ""
        rule = self.OFFER_TYPE_FILE_RULES.get(offer_type, {})
        allowed_types = rule.get('allowed_types', [])
        
        if allowed_types and ext not in allowed_types:
            allowed_str = ", ".join(allowed_types)
            return False, f"Invalid file format '.{ext}'. Supported formats for '{offer_type}' are: {allowed_str}."

        return True, ""

    def save_file_placeholder(self, filename: str, content: bytes) -> str:
        """Saves uploaded file content into uploads directory and returns local path."""
        file_id = str(uuid.uuid4())[:8]
        safe_filename = f"{file_id}_{filename.replace(' ', '_')}"
        dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        
        with open(dest_path, "wb") as f:
            f.write(content)
            
        return f"uploads/{safe_filename}"

file_handler = FileHandler()
