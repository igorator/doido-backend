import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'app_settings' })
export class AppSettings {
  @PrimaryColumn('int')
  id: number;

  @Column('boolean', { default: false })
  is_maintenance: boolean;
}
