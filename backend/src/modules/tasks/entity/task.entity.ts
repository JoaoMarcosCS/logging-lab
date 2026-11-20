import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from '../../boards/entity/board.entity.js';
import { EPriorityTask } from '../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../shared/enums/tasks/task-work-status.enum.js';

@Entity('tasks')
@Index('IDX_tasks_board_id_is_active_id', ['boardId', 'isActive', 'id'])
export class TaskEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_tasks_id' })
  id: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId: string;

  @ManyToOne(() => BoardEntity, { nullable: false })
  @JoinColumn({
    name: 'board_id',
    foreignKeyConstraintName: 'FK_tasks_board_id',
  })
  board?: BoardEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', enum: EPriorityTask })
  priority: EPriorityTask;

  @Column({
    name: 'work_status',
    type: 'int',
    enum: EWorkStatusTask,
    default: EWorkStatusTask.AWAITING_START,
  })
  workStatus: EWorkStatusTask;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
