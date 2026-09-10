output "vm_public_ip" {
  description = "Public IP address of the Kanban server"
  value       = google_compute_instance.kanban.network_interface[0].access_config[0].nat_ip
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository"
  value       = google_artifact_registry_repository.kanban.name
}