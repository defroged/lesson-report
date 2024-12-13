"# lesson-report" 

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