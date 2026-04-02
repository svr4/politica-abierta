CREATE TABLE StoryType (
        StoryTypeId INTEGER PRIMARY KEY AUTOINCREMENT,
        Description TEXT NOT NULL
    );
INSERT INTO StoryType(Description) VALUES('El Nuevo Día');
INSERT INTO StoryType(Description) VALUES('El Vocero');
INSERT INTO StoryType(Description) VALUES('Noticel');
CREATE TABLE Story (
        StoryId INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT NOT NULL,
        Description TEXT,
        Uri TEXT NOT NULL,
        SourceTypeId INTEGER,
        Media TEXT,
        ScrapedDate TEXT NOT NULL,
        Hash TEXT NOT NULL, ArticleText TEXT, SummaryText TEXT, CanSummarize BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (SourceTypeId) REFERENCES StoryType(StoryTypeId)
    );
CREATE TABLE Legislation (
        LegislationId INTEGER PRIMARY KEY AUTOINCREMENT,
        Number TEXT NOT NULL,
        FiledDate TEXT NOT NULL,
        Title TEXT NOT NULL,
        Author TEXT NOT NULL,
        CoAuthor TEXT,
        Uri TEXT NOT NULL,
        Committe INTEGER NOT NULL,
        AdministrationId INTEGER NOT NULL,
        LastEvent TEXT NOT NULL,
        ScrapedDate TEXT NOT NULL,
        Hash TEXT NOT NULL
    );
CREATE TABLE NotificationJob (
	NotifJobId INTEGER PRIMARY KEY AUTOINCREMENT,
	ObjectQty INTEGER NOT NULL,
	Data TEXT NOT NULL,
	JobDate TEXT NOT NULL,
	JobType TEXT NOT NULL,
	Processed BOOLEAN NOT NULL,
	Status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "ScrapingJob" (
	ScrapeJobId INTEGER PRIMARY KEY AUTOINCREMENT,
	ObjectQty INTEGER NOT NULL,
	JobStartDate TEXT NOT NULL,
	JobType TEXT NOT NULL,
	Processed BOOLEAN NOT NULL,
	Status TEXT NOT NULL
, JobEndDate TEXT);
CREATE INDEX legislation_hash_index ON Legislation(Hash);
CREATE TABLE RecentlyFiledLegislation (
	LegislationId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	Number TEXT NOT NULL,
	FiledDate TEXT NOT NULL,
	Title TEXT NOT NULL,
	Author TEXT,
	CoAuthor TEXT,
	Uri TEXT NOT NULL,
	AdministrationId INTEGER NOT NULL,
	LastEvent TEXT NOT NULL,
	ScrapedDate TEXT NOT NULL,
	Hash TEXT NOT NULL,
	Document Blob NOT NULL,
	DocDesc TEXT NOT NULL,
	DocUri TEXT NOT NULL,
	DocType TEXT NOT NULL,
	DocText TEXT,
	DocSummary TEXT
, EventDescription TEXT NULL);
CREATE INDEX recent_legislation_hash_index on RecentlyFiledLegislation(Hash);
CREATE VIRTUAL TABLE LegislationLookup USING fts5(Number, FiledDate, Title, Author, CoAuthor, Hash unindexed);
CREATE TRIGGER trigger_add_recent_legislation AFTER INSERT ON RecentlyFiledLegislation FOR EACH ROW WHEN new.Hash NOT IN (SELECT Hash FROM LegislationLookup) BEGIN
INSERT INTO LegislationLookup (Number, FiledDate, Title, Author, CoAuthor, Hash) VALUES (new.Number, new.FiledDate, new.Title, new.Author, new.CoAuthor, new.Hash); END;

CREATE TABLE IF NOT EXISTS "Configuration" (
ConfigId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
Config TEXT NOT NULL
);
CREATE TRIGGER trigger_add_legislation AFTER INSERT ON Legislation FOR EACH ROW WHEN new.Hash NOT IN (SELECT Hash FROM LegislationLookup) BEGIN INSERT INTO LegislationLookup (Number, FiledDate, Title, Author, CoAuthor, Hash) VALUES(new.Number, new.FiledDate, new.Title, new.Author, new.CoAuthor, new.Hash); END;
CREATE TABLE Notification (NotifId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, MatchedLegislation TEXT, MatchedNews TEXT, Message TEXT NOT NULL, Payload TEXT, NotificationDate TEXT NOT NULL, Read BOOLEAN NOT NULL DEFAULT 0, MatchedProjectsForEvents TEXT);
CREATE TABLE LegislationEvent(LegEventId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, Title TEXT NOT NULL, Description TEXT NOT NULL, Uri TEXT, Document BLOB, DocType TEXT, ScrapedDate TEXT NOT NULL, Hash TEXT UNIQUE NOT NULL, LegislationIdFk INTEGER NOT NULL, DocText TEXT, DocSummary TEXT, CreatedDate TEXT NOT NULL, FOREIGN KEY (LegislationIdFk) REFERENCES Legislation(LegislationId));
CREATE INDEX legislation_event_hash_index ON LegislationEvent(Hash);
CREATE TABLE SubscribedProject(SubProjectId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, LegislationIdFk INTEGER NOT NULL, Tags TEXT NULL, FOREIGN KEY (LegislationIdFk) REFERENCES Legislation(LegislationId));
