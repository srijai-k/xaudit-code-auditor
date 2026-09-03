import { Controller, Get, Query, Param, Injectable } from "@nestjs/common";

// A realistic NestJS controller — decorators on the class, methods, and
// parameters. Before decorator support was added to the parser, this
// entire file would have failed to parse at all (a hard parse error, zero
// findings, not even a partial result) regardless of what was inside it.
@Injectable()
export class ReportsService {
    constructor(private readonly dataSource: DataSource) {}

    async findByStatus(status: string) {
        // A realistic mistake: someone added an "advanced filter" and
        // reached for string building instead of a parameter.
        return this.dataSource.query("SELECT * FROM reports WHERE status = '" + status + "'");
    }

    async findById(id: string) {
        return this.dataSource.query("SELECT * FROM reports WHERE id = $1", [id]);
    }
}

@Controller("reports")
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get()
    async list(@Query("status") status: string) {
        return this.reportsService.findByStatus(status);
    }

    @Get(":id")
    async getOne(@Param("id") id: string) {
        return this.reportsService.findById(id);
    }
}
