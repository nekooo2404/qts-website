package vn.qts.identityadmin.application;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "qts.identity-bootstrap", name = "enabled", havingValue = "true", matchIfMissing = true)
public class IdentityBootstrapRunner implements ApplicationRunner {
    private final IdentityBootstrapService bootstrap;

    public IdentityBootstrapRunner(IdentityBootstrapService bootstrap) {
        this.bootstrap = bootstrap;
    }

    @Override
    public void run(ApplicationArguments args) {
        bootstrap.ensureBaseline();
    }
}
