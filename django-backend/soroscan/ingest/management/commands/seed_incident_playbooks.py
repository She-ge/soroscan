"""
Seed RemediationRule rows for the four incident response playbooks (#1330).
"""

from django.core.management.base import BaseCommand

from soroscan.ingest.models import RemediationRule
from soroscan.ingest.services.incident_playbooks import default_remediation_rule_specs


class Command(BaseCommand):
    help = "Seed default incident-response remediation rules from playbook mappings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print actions without writing to the database",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        created = 0
        updated = 0

        for spec in default_remediation_rule_specs():
            defaults = {
                "condition": spec["condition"],
                "actions": spec["actions"],
                "enabled": spec["enabled"],
                "grace_period_minutes": spec["grace_period_minutes"],
                "alert_type": spec["alert_type"],
                "dry_run": spec["dry_run"],
                "alert_target": "",
            }
            existing = RemediationRule.objects.filter(name=spec["name"]).first()
            if existing:
                if dry_run:
                    self.stdout.write(f"[dry-run] would update {spec['name']}")
                else:
                    for key, value in defaults.items():
                        setattr(existing, key, value)
                    existing.save()
                    updated += 1
                    self.stdout.write(self.style.SUCCESS(f"Updated {spec['name']}"))
            else:
                if dry_run:
                    self.stdout.write(f"[dry-run] would create {spec['name']}")
                else:
                    RemediationRule.objects.create(name=spec["name"], **defaults)
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f"Created {spec['name']}"))

        self.stdout.write(
            self.style.SUCCESS(f"Done. created={created} updated={updated} dry_run={dry_run}")
        )
