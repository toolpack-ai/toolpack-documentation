---
sidebar_position: 10
description: "Toolpack SDK database tools for AI-powered SQL operations. Query SQLite, PostgreSQL, and MySQL databases. Inspect schemas, list tables, and describe table structures."
keywords: [database tools, SQL query, SQLite, PostgreSQL, MySQL, AI database, schema inspection, Toolpack SDK database]
---

# Database Tools

Category: `database` · 7 tools

SQL operations for SQLite, PostgreSQL, and MySQL databases.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `db.query` | `db`, `sql`, `params?` | Execute SQL query |
| `db.schema` | `db`, `table?` | Get database/table schema |
| `db.tables` | `db` | List all tables |
| `db.insert` | `db`, `table`, `data` | Insert a row |
| `db.update` | `db`, `table`, `where`, `data` | Update rows |
| `db.delete` | `db`, `table`, `where` | Delete rows |
| `db.count` | `db`, `table`, `where?` | Count rows |

## Database Path (`db` parameter)

Every tool requires a `db` parameter - a connection URI or local file path:

```
# SQLite (local file)
./data.sqlite

# PostgreSQL
postgres://user:pass@host:5432/database

# MySQL
mysql://user:pass@host:3306/database
```

## Examples

### Querying Data

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me all users from the database' }],
    model: 'gpt-4o',
});
// AI uses db.query
```

### Schema Inspection

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What tables are in this database?' }],
    model: 'gpt-4o',
});
// AI uses db.tables and db.schema
```

### Data Manipulation

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Insert a new user with name "Alice"' }],
    model: 'gpt-4o',
});
// AI uses db.insert
```

## Supported Databases

- **SQLite** - Local file-based database
- **PostgreSQL** - Full support via connection string
- **MySQL** - Full support via connection string
