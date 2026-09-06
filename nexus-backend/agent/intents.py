from enum import Enum
from typing import List, Dict

class NexusIntent(str, Enum):
    # Expert-oriented intents
    EXPERT_PROFILE_CREATE = "expert_profile_create"
    EXPERT_PROFILE_EDIT = "expert_profile_edit"
    OFFERING_CREATE = "offering_create"
    OFFERING_EDIT = "offering_edit"
    NEWSLETTER_CREATE = "newsletter_create"
    CUSTOM_OFFERING_CREATE = "custom_offering_create"
    EARNINGS_INQUIRY = "earnings_inquiry"
    BOOKINGS_INQUIRY = "bookings_inquiry"

    # Client-oriented intents
    CLIENT_MATCH_SEARCH = "client_match_search"
    EXPERT_DISCOVERY = "expert_discovery"
    BOOKING_REQUEST = "booking_request"
    OFFERING_INQUIRY = "offering_inquiry"

    # Shared / System intents
    ROLE_TRANSITION = "role_transition"
    GENERAL_CHAT = "general_chat"
    HELP_NAVIGATION = "help_navigation"

INTENT_DESCRIPTIONS: Dict[str, str] = {
    NexusIntent.EXPERT_PROFILE_CREATE: "Creating or setting up a new expert profile or bio",
    NexusIntent.EXPERT_PROFILE_EDIT: "Editing or updating an existing expert profile, bio, or tags",
    NexusIntent.OFFERING_CREATE: "Creating a new product, 1:1 session, or subscription offering",
    NexusIntent.OFFERING_EDIT: "Updating pricing, title, or description of existing offerings",
    NexusIntent.EARNINGS_INQUIRY: "Checking earnings, payouts, revenue, or financial reports",
    NexusIntent.BOOKINGS_INQUIRY: "Viewing scheduled client appointments, calendar, or upcoming bookings",

    NexusIntent.CLIENT_MATCH_SEARCH: "Searching or asking for expert recommendations for a project/need",
    NexusIntent.EXPERT_DISCOVERY: "Browsing categories or asking about top experts in a domain",
    NexusIntent.BOOKING_REQUEST: "Inquiring how to book or hire an expert",
    NexusIntent.OFFERING_INQUIRY: "Asking about an expert's digital products, courses, or services",

    NexusIntent.ROLE_TRANSITION: "Asking to switch between expert and client role",
    NexusIntent.GENERAL_CHAT: "General questions, greetings, or conversational banter",
    NexusIntent.HELP_NAVIGATION: "Asking for help on how to navigate NEXUS or use the platform"
}

SUGGESTED_ACTIONS_BY_INTENT: Dict[str, List[str]] = {
    NexusIntent.EXPERT_PROFILE_CREATE: ["Set Headline & Category", "Add Bio Details", "Publish Expert Profile"],
    NexusIntent.EXPERT_PROFILE_EDIT: ["Update Bio", "Add Expertise Tags", "Change Professional Headline"],
    NexusIntent.OFFERING_CREATE: ["Create a 1:1 Session ($300)", "Publish a Book / Digital Product", "Set up $49/mo Subscription"],
    NexusIntent.OFFERING_EDIT: ["Update Offering Price", "Edit Session Description", "View Active Offerings"],
    NexusIntent.NEWSLETTER_CREATE: ["Draft Weekly Digest", "Set Target Audience", "Schedule Broadcast"],
    NexusIntent.CUSTOM_OFFERING_CREATE: ["Set Custom Project Scope", "Define Delivery Timeline", "Specify Project Rate"],
    NexusIntent.EARNINGS_INQUIRY: ["View Net Earnings (70%)", "Check Payout Threshold", "View Incoming Bookings"],
    NexusIntent.BOOKINGS_INQUIRY: ["View Incoming Schedule", "Set Weekly Hours (9 AM - 5 PM)", "Check Booking Notes"],

    NexusIntent.CLIENT_MATCH_SEARCH: ["Find AI & LLM Experts", "Search Growth Marketers", "Find CFO Advisory Experts"],
    NexusIntent.EXPERT_DISCOVERY: ["Browse Top Categories", "Search Verified Experts", "View Expert Profiles"],
    NexusIntent.BOOKING_REQUEST: ["View Expert Availability", "Select Session Offering", "Confirm Video Booking"],
    NexusIntent.OFFERING_INQUIRY: ["View Offering Details", "Explore Digital Products", "Book 1:1 Session"],

    NexusIntent.ROLE_TRANSITION: ["Switch to Client", "Switch to Expert"],
    NexusIntent.GENERAL_CHAT: ["Find an AI Expert", "Explore Platform Features", "View Marketplace"],
    NexusIntent.HELP_NAVIGATION: ["NEXUS Overview", "Account Settings", "Platform Guide"]
}

def get_role_aware_suggested_actions(intent: str, role: str = "client") -> List[str]:
    if role == "expert":
        expert_actions = {
            NexusIntent.GENERAL_CHAT: [
                "Create a 1:1 Consultation Session for $300 (60 min)",
                "Draft a Weekly Subscriber Newsletter Broadcast",
                "Check My Verified Earnings & Payout Status",
                "View My Active Offerings & Products"
            ],
            NexusIntent.OFFERING_CREATE: [
                "Create a 1:1 Session for $300 (60 min, Mon–Fri)",
                "Publish a Book or Digital PDF Product",
                "Set up a $49/mo Subscription Plan",
                "Draft a Subscriber Newsletter Broadcast"
            ],
            NexusIntent.EARNINGS_INQUIRY: [
                "View Monthly Net Earnings (70% After Platform Fee)",
                "Check Payout Eligibility & Threshold",
                "View Incoming Client Bookings & Schedule"
            ],
            NexusIntent.BOOKINGS_INQUIRY: [
                "View Upcoming Client Consultation Schedule",
                "Set Available Hours (Mon–Fri, 09:00 AM – 05:00 PM)",
                "Check Session Notes & Booking Details"
            ],
            NexusIntent.EXPERT_PROFILE_CREATE: [
                "Set Professional Headline & Category",
                "Add Bio Summary & Expertise Tags",
                "Confirm & Publish Expert Profile"
            ]
        }
        if intent in expert_actions:
            return expert_actions[intent]

    client_actions = {
        NexusIntent.GENERAL_CHAT: [
            "Find an AI & Machine Learning Expert for My Project",
            "Search Growth & Marketing Strategists for Product Launch",
            "View My Scheduled Bookings & Video Sessions",
            "Explore Verified Experts Across All Categories"
        ],
        NexusIntent.CLIENT_MATCH_SEARCH: [
            "Find AI Architecture & LLM Integration Experts",
            "Search Growth & Marketing Strategy Specialists",
            "Find Financial & Cash Flow Advisory Consultants"
        ],
        NexusIntent.BOOKING_REQUEST: [
            "View Expert Availability Hours & Schedule",
            "Book a 1:1 Video Consultation Session",
            "Explore Marketplace Offerings & Products"
        ],
        NexusIntent.BOOKINGS_INQUIRY: [
            "View My Scheduled Video Sessions & Appointments",
            "Check Session Details, Time & Notes",
            "Find More Verified Experts for New Projects"
        ]
    }
    if intent in client_actions:
        return client_actions[intent]

    return SUGGESTED_ACTIONS_BY_INTENT.get(intent, [
        "Find an Expert for My Project" if role == "client" else "Create a 1:1 Consultation Session",
        "View My Bookings & Sessions" if role == "client" else "Check My Earnings & Payout Status"
    ])
