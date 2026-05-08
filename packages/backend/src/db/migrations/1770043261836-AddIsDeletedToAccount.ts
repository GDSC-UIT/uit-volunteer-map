import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsDeletedToAccount1770043261836 implements MigrationInterface {
    name = "AddIsDeletedToAccount1770043261836"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("Account", new TableColumn({
            name: "IsDeleted",
            type: "boolean",
            default: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("Account", "IsDeleted");
    }
}