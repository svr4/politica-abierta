init:
	sqlite3 db/imparcial.db < db/imparcial_db_schema.sql
	export PA_PROJECT_DIR=$(pwd)