### **Run the Services**

- Start the services using:
  ```bash
  docker compose up -d
  ```
- This will:
  - Start the `db` service (PostgreSQL database).
  - Build and start the `backend` service.
  - Ensure the database is only accessible within the `internal` network.

---

### **Verify Database Backups**

- To manually trigger a database backup, run:
  ```bash
  docker compose run --rm db-backup
  ```
- This will create a timestamped `.sql` file in the `pgbackups` volume.

---

### **Access the Backup Files**

- To access the backup files stored in the `pgbackups` volume:
  ```bash
  docker volume inspect backend_pgbackups
  ```
- This will show the mount point of the volume on your host machine. Navigate to that directory to retrieve the backup files.

---

### **Restore a Backup (if needed)**

- To restore a backup, copy the `.sql` file from the `pgbackups` volume to your local machine, then use the following command:
  ```bash
  docker exec -i <db-container-id> psql -U uptube -d uptube < /path/to/backup.sql
  ```
- Replace `<db-container-id>` with the container ID of the `db` service.

---

### **Automate Backups (Optional)**

- If you want to automate backups, you can use a cron job or a task scheduler to periodically run the `db-backup` service. For example:
  ```bash
  echo "0 2 * * * docker compose run --rm db-backup" | crontab -
  ```
- This will create a backup every day at 2 AM.

---

Let me know if you need further clarification!
