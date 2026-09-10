terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "google" {
  project = "river-hold-484204-h9"
  region  = "us-central1"
  zone    = "us-central1-a"
}

resource "google_artifact_registry_repository" "kanban" {
  location      = "us-central1"
  repository_id = "kanban-repo"
  description   = "Docker repository for Kanban application"
  format        = "DOCKER"
}

data "google_compute_network" "default" {
  name = "default"
}

resource "google_compute_firewall" "kanban_http" {
  name    = "kanban-allow-http"
  network = data.google_compute_network.default.name

  allow {
    protocol = "tcp"
    ports    = ["80", "5000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["kanban-server"]
}

resource "google_compute_firewall" "kanban_ssh" {
  name    = "kanban-allow-ssh"
  network = data.google_compute_network.default.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["kanban-server"]
}

resource "google_compute_instance" "kanban" {
  name         = "kanban-server"
  machine_type = "e2-micro"
  zone         = "us-central1-a"

  tags = ["kanban-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 30
      type  = "pd-standard"
    }
  }

  network_interface {
    network = data.google_compute_network.default.name

    access_config {
      # Ephemeral public IP
    }
  }
}