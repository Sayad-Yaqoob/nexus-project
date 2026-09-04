from enum import Enum
from typing import List, Dict

class NexusIntent(str, Enum):
    # Expert-oriented intents
    EXPERT_PROFILE_CREATE = "expert_profile_create"
    EXPERT_PROFILE_EDIT = "expert_profile_edit"
    OFFERING_CREATE = "offering_create"
    OFFERING_EDIT = "offering_edit"
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
    NexusIntent.EXPERT_PROFILE_CREATE: ["Edit Profile Headline", "Add Bio Details", "Set Hourly Rate"],
    NexusIntent.EXPERT_PROFILE_EDIT: ["Update Bio", "Add Expertise Tags", "Connect Calendar"],
    NexusIntent.OFFERING_CREATE: ["Create 1:1 Session", "Upload Digital Product", "Set Subscription Price"],
    NexusIntent.OFFERING_EDIT: ["Change Price", "Edit Description", "Toggle Active Status"],
    NexusIntent.EARNINGS_INQUIRY: ["View Monthly Earnings", "Check Payout Status", "Download Statement"],
    NexusIntent.BOOKINGS_INQUIRY: ["View Calendar", "Set Availability Hours", "Reschedule Session"],

    NexusIntent.CLIENT_MATCH_SEARCH: ["Find AI Experts", "Find Software Architects", "Find Growth Marketers"],
    NexusIntent.EXPERT_DISCOVERY: ["Browse Top Categories", "Search Verified Experts", "Filter by Hourly Rate"],
    NexusIntent.BOOKING_REQUEST: ["View Expert Availability", "Select Session Offering", "Confirm Booking"],
    NexusIntent.OFFERING_INQUIRY: ["View Offering Details", "Download Preview", "Contact Expert"],

    NexusIntent.ROLE_TRANSITION: ["Switch to Client", "Switch to Expert"],
    NexusIntent.GENERAL_CHAT: ["How does NEXUS work?", "Find an expert", "Create offering"],
    NexusIntent.HELP_NAVIGATION: ["NEXUS Overview", "Account Settings", "Support"]
}
