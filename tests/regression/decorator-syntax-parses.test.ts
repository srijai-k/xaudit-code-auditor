import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * Regression test for a real reliability gap found by probing the parser
 * directly with realistic modern TypeScript (not reported by a user):
 * before `decorators-legacy` was added to parse.ts's plugin list, ANY file
 * using a class/method/parameter decorator failed to parse at all and got
 * a hard parse error — zero rule coverage for the whole file, silently.
 * This affects an enormous share of real-world backend TypeScript: NestJS,
 * Angular, TypeORM entities, class-validator DTOs, and InversifyJS all use
 * decorators as their primary style.
 *
 * `decorators-legacy` (the `experimentalDecorators` proposal) was chosen
 * over the newer TC39 `decorators` plugin specifically because the latter
 * doesn't support parameter decorators at all — and `@Param('id') id`-
 * style parameter decorators are exactly what NestJS controllers look
 * like. This was checked empirically, not assumed — see parse.ts's own
 * comment and docs/model-improvements.md.
 */
describe("regression: decorator-based TypeScript parses and is actually analyzed, not just accepted", () => {
    it("a NestJS-style controller with class/method/parameter decorators parses successfully", () => {
        const code = `
@Injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
    });

    it("a real vulnerability inside a decorated class is still caught, not just tolerated by the parser", () => {
        const code = `
@Injectable()
export class ReportController {
  @Get('export')
  async exportByStatus(@Query('status') status: string) {
    return db.query("SELECT * FROM reports WHERE status = '" + status + "'");
  }
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "sqli-dynamic-query")).toBe(true);
    });

    it("a TypeORM entity with property decorators parses and its dangerous methods are still analyzed", () => {
        const code = `
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  static async findByRawEmail(dataSource, email: string) {
    return dataSource.query("SELECT * FROM user WHERE email = '" + email + "'");
  }
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "sqli-dynamic-query")).toBe(true);
    });
});
