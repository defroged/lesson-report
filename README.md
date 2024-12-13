"# lesson-report" 

## Flow of events:

1. The user chooses the class name and date from a dynamically populated drop-down menu. 
2. The user takes pictures of the class and uploads them with the "Class Pictures" button.
3. The user takes pictures of the whiteboard, lesson plan, used materials (flash cards, worksheets, etc.) and uploads them with the "Lesson Material" button.
4. The user pastes a URL for the homework.
5. The user clicks the submit button.
6. The Class Pictures are uploaded to the Firestore database and stored in the corresponding class with the corresponding date.
7. The Lesson Material pictures are sent to an API for further processing and extraction of text etc' by an AI and/or OCR, and returned as text data split into the following categories: 
Vocabulary
Phrases and Sentences
Grammar
Activities
8. All of the above data is automatically added to a pre-designed lesson report page for each class, that shows a timeline with the details, pictures, and homework URL for each weekly lesson.

## Firestore Database structure:

The current structure of my Firestore database is as follows:
classes (Collection)
│
└── Hedgehog (Document)
    ├── name: "Hedgehog"
    ├── teacher: "Ron"
    └── lessonReports (Collection)
        └──  XC7khVgPeXauQRB9lXrM  (Document ID)
            ├── date (timestamp)
            ├── classPictures (Array of URLs of pictures)
            ├── homeworkURL (string of a URL)
            └── processedData (map)
                ├── activities (array of strings)
                ├── grammar (array of strings)
                ├── phrasesAndSentences (array of strings)
                ├── vocabulary (array of strings)
				
				
				## Project Summary: Lesson Report Timeline Web App ##
Objective:

Develop a secure and user-friendly web application that allows students to view a chronological timeline of lesson reports for their respective classes. The app authenticates students using a password, retrieves their class information, and displays detailed lesson reports fetched from a Firestore database.
Current Progress:

    User Authentication:
        Password-Based Login: Students enter a 4-digit password to authenticate.
        Class Identification: Upon successful password entry, the app retrieves and displays the corresponding class name by querying a Google Sheets document via the existing fetchData.js API.

    Frontend Structure:

        HTML (index.html):
            Password Modal: A modal dialog prompts users to enter their password.
            Timeline Container: An initially hidden section designated to display the lesson report timeline once authenticated.
            Load More Button: Facilitates pagination by allowing users to load additional lesson reports as needed.

        JavaScript (script.js):
            Password Handling: Manages the submission of passwords and handles the display logic based on authentication results.
            Data Fetching: Integrates with the getLessonReports.js API to retrieve lesson reports from Firestore.
            Timeline Rendering: Dynamically generates and appends timeline items to the DOM based on fetched data.
            Pagination: Implements a "Load More" functionality to fetch and display additional lesson reports incrementally.

        CSS (styles.css):
            Responsive Design: Ensures the app is visually appealing and functional across various device sizes.
            Timeline Styling: Styles the timeline and its items for clear and organized presentation.
            Button Animations: Enhances user interaction with animated "Load More" buttons.
            Cleaned Up Styles: Removed unnecessary WordPress-specific gallery styles to maintain a streamlined and relevant stylesheet.

    Backend APIs:
        Password Verification (fetchData.js):
            Google Sheets Integration: Validates student passwords against entries in a Google Sheets document.
            Class Retrieval: Returns the class name associated with the entered password upon successful verification.
        Lesson Reports Retrieval (getLessonReports.js):
            Firestore Integration: Connects to Firestore to fetch lesson reports specific to the authenticated class.
            Data Structure: Retrieves reports containing dates, class pictures, homework URLs, and processed data (activities, grammar, phrases, vocabulary).
            Pagination Support: Implements cursor-based pagination to efficiently handle large datasets and improve performance.

    Security Configuration:
        Firestore Security Rules:
            Restricted Access: Denies all client-side read and write operations to ensure that only the secure backend can interact with the database.
            Future-Proofing: Prepared for potential role-based access controls by outlining optional rules for authenticated users and admins.
        Firebase Storage Security Rules:
            Controlled Read Access: Allows public read access specifically to class pictures stored under designated paths (classPictures/{className}/{pictureId}).
            Write Protection: Prevents client-side uploads or modifications, ensuring that only the backend can manage storage contents.
            General Denials: Restricts access to all other storage paths to protect against unauthorized data access.

    Environment Configuration:
        Firebase Admin SDK Initialization: Set up within the getLessonReports.js API to securely interact with Firestore using service account credentials.
        Environment Variables: Configured to securely store Firebase project credentials, ensuring sensitive information remains protected and is not exposed in the codebase.