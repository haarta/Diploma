package com.medisystem.appointment.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Bean
    public MinioClient minioClient(StorageProperties storage) {
        return MinioClient.builder()
                .endpoint(storage.endpoint())
                .credentials(storage.accessKey(), storage.secretKey())
                .build();
    }

    @Bean
    public org.springframework.boot.CommandLineRunner minioBucketInitializer(
            MinioClient minioClient,
            StorageProperties storage
    ) {
        return args -> {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(storage.bucket()).build()
            );
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(storage.bucket()).build());
            }

            if (storage.publicRead()) {
                String policy = """
                        {
                          "Version":"2012-10-17",
                          "Statement":[
                            {
                              "Effect":"Allow",
                              "Principal":{"AWS":["*"]},
                              "Action":["s3:GetObject"],
                              "Resource":["arn:aws:s3:::%s/*"]
                            }
                          ]
                        }
                        """.formatted(storage.bucket());

                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(storage.bucket())
                                .config(policy)
                                .build()
                );
            }
        };
    }
}
