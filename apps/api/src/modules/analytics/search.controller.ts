import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SearchService } from './search.service.js';
import { UnifiedSearchDto } from '@community-os/contracts';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async search(@Body() dto: UnifiedSearchDto) {
    return this.searchService.search(dto);
  }
}
