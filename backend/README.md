# Backend

## Migrations

Commandes exécutées et résultats (extraits) :

```bash
# Vérification connexion Alembic
alembic current
# -> INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# -> INFO  [alembic.runtime.migration] Will assume transactional DDL.

# Génération migration (autogenerate)
alembic revision --autogenerate -m "initial_schema"
# -> Generating .../alembic/versions/<id>_initial_schema.py ... done

# Application des migrations
alembic upgrade head
# -> INFO  [alembic.runtime.migration] Running upgrade  -> <id>, initial_schema

# Vérification tables en base
docker exec -it world-models-postgres psql -U postgres -d world_models -c "\dt"
# -> listes des tables : alembic_version, jobs, models, papers, test_results
```
