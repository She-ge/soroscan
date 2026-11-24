# Reset Admin Password Command

## Overview

A Django management command that makes it easy for developers to reset their local admin password when they forget it.

## Usage

### Interactive Mode (Recommended)

Prompts for password input:

```bash
python manage.py reset_admin_password
```

You'll be prompted to enter and confirm the new password:

```
Resetting password for user: admin
Enter new password: 
Confirm new password: 

✓ Password successfully updated for user 'admin'
```

### Non-Interactive Mode

Provide password via command line argument:

```bash
python manage.py reset_admin_password --password newpass123
```

### Reset Password for Different User

```bash
python manage.py reset_admin_password --username myuser --password newpass456
```

## Options

- `--username` - Username to reset password for (default: `admin`)
- `--password` - New password (if not provided, will prompt interactively)

## Examples

### Reset admin password interactively

```bash
python manage.py reset_admin_password
```

### Reset admin password non-interactively

```bash
python manage.py reset_admin_password --password MyNewSecurePassword123
```

### Reset password for a different user

```bash
python manage.py reset_admin_password --username developer --password DevPass456
```

### Use in Docker

```bash
docker-compose exec backend python manage.py reset_admin_password
```

### Use in Kubernetes

```bash
kubectl exec -it deployment/soroscan-backend -n soroscan -- python manage.py reset_admin_password
```

## Error Handling

### User doesn't exist

If the specified user doesn't exist, the command will:

1. Display an error message
1. List all available usernames
1. Exit with an error code

Example output:

```
User 'nonexistent' does not exist.

Available users: admin, developer, testuser

CommandError: User 'nonexistent' not found.
```

### Password mismatch (interactive mode)

If passwords don't match during interactive input:

```
CommandError: Passwords do not match.
```

### Empty password

If an empty password is provided:

```
CommandError: Password cannot be empty.
```

### Non-interactive without password

If running in non-interactive mode (e.g., in a script) without `--password`:

```
CommandError: Password must be provided via --password when running non-interactively
```

## Security Considerations

- **Interactive mode is recommended** for production environments to avoid password exposure in shell history
- Passwords are never echoed to the terminal in interactive mode
- The command uses Django's built-in `set_password()` method which properly hashes passwords
- Only updates the password field; all other user attributes are preserved

## Testing

Run the test suite:

```bash
pytest soroscan/ingest/tests/test_reset_admin_password.py -v
```

Test coverage includes:

- Password reset with `--password` argument
- Password reset for custom username
- User doesn't exist error handling
- Interactive password prompt
- Password mismatch handling
- Empty password handling
- Non-interactive mode validation
- Authentication with new password
- Multiple password resets
- Preservation of other user fields

## Common Use Cases

### Forgot local admin password

```bash
python manage.py reset_admin_password
# Enter new password when prompted
```

### Setting up a new development environment

```bash
python manage.py reset_admin_password --password devpass123
```

### Automated testing/CI setup

```bash
python manage.py reset_admin_password --username testadmin --password testpass
```

### Docker Compose setup script

```bash
#!/bin/bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py reset_admin_password --password admin123
echo "Admin password set to: admin123"
```

## Implementation Details

The command:

1. Uses Django's `get_user_model()` to support custom user models
1. Calls `user.set_password()` which properly hashes the password
1. Saves the user object to persist changes
1. Provides clear success/error messages
1. Handles both interactive and non-interactive modes

## Troubleshooting

### Command not found

Make sure you're in the correct directory:

```bash
cd django-backend
python manage.py reset_admin_password
```

### Permission denied

Ensure you have write access to the database:

```bash
# Check database permissions
ls -la db.sqlite3  # For SQLite
# or check PostgreSQL permissions
```

### User model issues

If using a custom user model, ensure it's properly configured in `settings.py`:

```python
AUTH_USER_MODEL = 'your_app.YourUserModel'
```

## Related Commands

- `python manage.py createsuperuser` - Create a new superuser
- `python manage.py changepassword <username>` - Django's built-in password change command

## Advantages Over Django's Built-in `changepassword`

1. **Better defaults** - Assumes `admin` username by default
1. **Better error messages** - Shows available users when user not found
1. **Simpler syntax** - Fewer required arguments
1. **Developer-friendly** - Designed specifically for the "forgot password" use case
