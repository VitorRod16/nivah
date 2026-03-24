package com.nivah;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class NivahApplication {

    public static void main(String[] args) {
        SpringApplication.run(NivahApplication.class, args);
    }
}
