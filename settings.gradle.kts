pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
    plugins {
        id("org.springframework.boot") version "3.2.1"
        id("io.spring.dependency-management") version "1.1.6"
    }
}

rootProject.name = "Diploma"

include("backend")
include("services:auth-service")
include("services:patient-service")
include("services:appointment-service")
