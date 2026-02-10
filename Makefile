.PHONY: setup-config

setup-config:
	@if [ -f backend/config.php ]; then \
		echo "backend/config.php already exists; nothing to do."; \
	else \
		cp backend/config.php.example backend/config.php; \
		echo "Created backend/config.php from example."; \
	fi
