import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      const existing = await this.categoryRepository.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Category "${dto.name}" already exists`);

      const category = this.categoryRepository.create(dto);
      const saved = await this.categoryRepository.save(category);
      this.logger.log(`Created category: ${saved.name} (id: ${saved.id})`);
      return saved;
    } catch (error: unknown) {
      this.logger.error(`Failed to create category: ${(error as Error).message}`);
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({ order: { name: 'ASC' } });
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch categories: ${(error as Error).message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) throw new NotFoundException(`Category #${id} not found`);
      return category;
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch category #${id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.findOne(id);
      Object.assign(category, dto);
      const updated = await this.categoryRepository.save(category);
      this.logger.log(`Updated category #${id}`);
      return updated;
    } catch (error: unknown) {
      this.logger.error(`Failed to update category #${id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const category = await this.findOne(id);
      await this.categoryRepository.remove(category);
      this.logger.log(`Deleted category #${id}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to delete category #${id}: ${(error as Error).message}`);
      throw error;
    }
  }
}
