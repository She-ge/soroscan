# Reset Admin Password - Quick Reference

## TL;DR

Forgot your admin password? Run this:

```bash
python manage.py reset_admin_password
```

## Common Commands

```bash
# Interactive (recommended)
python manage.py reset_admin_password

# Non-interactive
python manage.py reset_admin_password --password newpass123

# Different user
python manage.py reset_admin_password --username myuser

# Docker
docker-compose exec backend python manage.py reset_admin_password

# Kubernetes
kubectl exec -it deployment/soroscan-backend -- python manage.py reset_admin_password
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--username` | User to reset | `admin` |
| `--password` | New password | Prompts interactively |

## Examples

### Local Development

```bash
cd django-backend
python manage.py reset_admin_password
# Enter password when prompted
```

### CI/CD Setup

```bash
python manage.py reset_admin_password --username testadmin --password testpass
```

### Docker Compose

```bash
docker-compose exec backend python manage.py reset_admin_password --password admin123
```

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `User 'X' does not exist` | User not found | Check username or create user first |
| `Passwords do not match` | Confirmation failed | Re-enter matching passwords |
| `Password cannot be empty` | Empty password | Provide a non-empty password |

## Testing

```bash
# Run tests
pytest soroscan/ingest/tests/test_reset_admin_password.py -v

# Quick verification
python verify_reset_password.py
```

## Tips

✅ **DO:**

- Use interactive mode for production
- Use strong passwords
- Test the new password immediately

❌ **DON'T:**

- Put passwords in shell scripts (use interactive mode)
- Use weak passwords
- Share passwords in documentation

## Troubleshooting

**Command not found?**

```bash
cd django-backend
python manage.py reset_admin_password
```

**User doesn't exist?**

```bash
# Create the user first
python manage.py createsuperuser --username admin
```

**Still can't login?**

```bash
# Verify the password was set
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(username='admin')
>>> user.check_password('your_password')
True
```

## Related Commands

```bash
# Create new superuser
python manage.py createsuperuser

# Django's built-in password change
python manage.py changepassword admin
```

## Documentation

- Full docs: `RESET_ADMIN_PASSWORD.md`
- Implementation: `RESET_ADMIN_PASSWORD_SUMMARY.md`
- Tests: `soroscan/ingest/tests/test_reset_admin_password.py`
