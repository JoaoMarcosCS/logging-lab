import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTask1794769470218 implements MigrationInterface {
  name = 'CreateTask1794769470218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL, "board_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "priority" integer NOT NULL, "work_status" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_board_id_is_active_id" ON "tasks"  ("board_id", "is_active", "id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_board_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tasks_board_id_is_active_id"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
