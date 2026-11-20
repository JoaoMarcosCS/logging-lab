import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoard1794769470217 implements MigrationInterface {
  name = 'CreateBoard1794769470217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "boards" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "title" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_boards_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_user_id_is_active_id" ON "boards"  ("user_id", "is_active", "id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_boards_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "FK_boards_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_boards_user_id_is_active_id"`,
    );
    await queryRunner.query(`DROP TABLE "boards"`);
  }
}
