import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Hero, Publisher } from '../../interfaces/hero.interface';
import { HeroesService } from '../../services/heroes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-new-page',
  templateUrl: './new-page.component.html',
  styles: [],
})
export class NewPageComponent implements OnInit {
  public heroForm = new FormGroup({
    id: new FormControl<string>(''),
    superhero: new FormControl<string>('', { nonNullable: true }),
    publisher: new FormControl<Publisher>(Publisher.DCComics),
    alter_ego: new FormControl(''),
    first_appearance: new FormControl(''),
    characters: new FormControl(''),
    alt_img: new FormControl(''),
  });

  constructor(
    private heroesService: HeroesService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  get currentHero(): Hero {
    const hero = this.heroForm.value as Hero;
    return hero;
  }

  ngOnInit(): void {
    if (!this.router.url.includes('edit')) return;

    this.activatedRoute.params
      .pipe(switchMap(({ id }) => this.heroesService.getHeroById(id)))
      .subscribe((hero) => {
        if (!hero) return this.router.navigateByUrl('/');

        this.heroForm.reset(hero);
        return;
      });
  }

  public publishers = [
    { id: 'DC Comics', desc: 'DC - Comics' },
    { id: 'Marvel Comics', desc: 'Marvel - Comics' },
  ];

  public onSubmit(): void {
    if (this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }

    if (this.currentHero.id) {
      this.heroesService.updateHero(this.currentHero).subscribe((hero) => {
        this.showSnackbar('Hero updated');
      });

      return;
    } else {
      this.heroesService.addHero(this.currentHero).subscribe((hero) => {
        this.showSnackbar('Hero added');
        this.router.navigateByUrl('/heroes/edit/' + hero.id);
      });
    }
  }

  public onDeleteHero(): void {
    if (!this.currentHero.id) throw new Error('No hero id');

    const dialog = this.dialog.open(ConfirmDialogComponent, {
      data: this.currentHero.superhero,
    });

    dialog.afterClosed()
    .pipe(
      filter((result: boolean) => result),
      switchMap(() => this.heroesService.deleteHeroById(this.currentHero.id!)),
      filter((wasDeleted: boolean) => wasDeleted)
    )
    .subscribe(() => {
      this.showSnackbar('Hero deleted');
      this.router.navigateByUrl('/heroes');
    });

    /*dialog.afterClosed().subscribe((result) => {
      if (!result) return;
      this.heroesService.getHeroById(this.currentHero.id!);
      this.router.navigateByUrl('/heroes');
    });*/
  }

  private showSnackbar(message: string): void {
    this.snackbar.open(message, 'Ok!', {
      duration: 2500,
    });
  }
}
