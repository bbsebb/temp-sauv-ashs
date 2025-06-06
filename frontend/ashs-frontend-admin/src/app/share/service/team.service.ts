import {inject, Injectable} from '@angular/core';
import {Team} from '@app/share/model/team';
import {MatDialog} from '@angular/material/dialog';
import {
  AddTrainingSessionInTeamDTORequest,
  toAddTrainingSessionInTeamDTORequest
} from '@app/share/service/dto/add-training-session-in-team-d-t-o-request';
import {catchError, forkJoin, iif, Observable, of, switchMap, throwError} from 'rxjs';
import {TrainingSession} from '@app/share/model/training-session';
import {
  AddRoleCoachInTeamDTORequest,
  toAddRoleCoachInTeamDTORequest
} from '@app/share/service/dto/add-role-coach-in-team-d-t-o-request';
import {RoleCoach} from '@app/share/model/role-coach';
import {HalFormService} from '@app/share/service/hal-form.service';
import {CreateTeamDTORequest} from '@app/share/service/dto/create-team-d-t-o-request';
import {FormTrainingSessionDTO} from '@app/share/service/dto/form-training-session-d-t-o';
import {FormRoleCoachDTO} from '@app/share/service/dto/form-role-coach-d-t-o';
import {AllHalResources, HalResource, PaginatedHalResource} from '@app/share/model/hal/hal';
import {PaginationOption} from '@app/share/service/pagination-option';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  matDialog = inject(MatDialog);
  halFormService = inject(HalFormService);
  private static readonly PAGINATION_OPTION_DEFAULT: PaginationOption = {
    size: 20,
    page: 0
  };

  constructor() {
  }

  getTeams(paginationOption: PaginationOption = TeamService.PAGINATION_OPTION_DEFAULT): Observable<AllHalResources<Team> | PaginatedHalResource<Team>> {
    return this.halFormService.root.pipe(
      switchMap((root) =>
        iif(
          () => paginationOption == 'all',
          this.halFormService.follow<AllHalResources<Team>>(root, "allTeams"),
          this.halFormService.follow<PaginatedHalResource<Team>>(root, "teams", this.halFormService.buildParamPage(paginationOption))
        )
      )
    );
  }


  createTeamWithTrainingSessionsAndRoleCoaches(
    team: HalResource,
    teamDtoCreateRequest: CreateTeamDTORequest,
    trainingSessionsDTORequest: FormTrainingSessionDTO[],
    roleCoachesDTORequest: FormRoleCoachDTO[]
  ) {
    return this.createTeam(team, teamDtoCreateRequest).pipe(
      switchMap(team =>
        forkJoin({
          team: of(team),
          trainingResults: this.addTrainingSessions(team, trainingSessionsDTORequest.map(ts => toAddTrainingSessionInTeamDTORequest(ts))),
          roleCoachResults: this.addRoleCoaches(team, roleCoachesDTORequest.map(rc => toAddRoleCoachInTeamDTORequest(rc)))
        }).pipe(
          catchError(error =>
            this.deleteTeam(team).pipe(
              // transmettre l'erreur originale après suppression
              switchMap(() => throwError(() => error))
            )
          )
        )
      ),
    );
  }

  createTeam(
    team: HalResource,
    teamDtoCreateRequest: CreateTeamDTORequest,
  ) {
    if (!this.halFormService.canAction(team, 'createTeam')) {
      throw new Error("L'action createTeam n'est pas disponible sur l'objet " + teamDtoCreateRequest);
    }
    return this.halFormService.doAction<Team>(team, 'createTeam', teamDtoCreateRequest)
  }

  updateTeamWithTrainingSessionsAndRoleCoaches(
    team: Team,
    teamDtoUpdateRequest: CreateTeamDTORequest,
    trainingSessionsDTORequest: FormTrainingSessionDTO[],
    trainingSessionsToDelete: TrainingSession[],
    roleCoachesDTORequest: FormRoleCoachDTO[],
    roleCoachesToDelete: RoleCoach[]
  ) {
    if (!this.halFormService.canAction(team, 'updateTeam')) {
      throw new Error("L'action updateTeam n'est pas disponible sur l'objet " + team);
    }
    return this.updateTeam(team, teamDtoUpdateRequest).pipe(
      switchMap(team =>
        forkJoin({
          team: of(team),
          trainingResults: this.addTrainingSessions(team, trainingSessionsDTORequest.map(ts => toAddTrainingSessionInTeamDTORequest(ts))),
          roleCoachResults: this.addRoleCoaches(team, roleCoachesDTORequest.map(rc => toAddRoleCoachInTeamDTORequest(rc))),
          deletedTrainingSessions: this.deleteTrainingSessions(trainingSessionsToDelete),
          deletedRoleCoaches: this.deleteRoleCoaches(roleCoachesToDelete)
        }).pipe(
          catchError(error =>
            this.deleteTeam(team).pipe(
              // transmettre l'erreur originale après suppression
              switchMap(() => throwError(() => error))
            )
          )
        )
      )
    )
  }

  updateTeam(team: Team, teamDtoUpdateRequest: CreateTeamDTORequest) {
    if (!this.halFormService.canAction(team, 'updateTeam')) {
      throw new Error("L'action updateTeam n'est pas disponible sur l'objet " + teamDtoUpdateRequest);
    }
    return this.halFormService.doAction<Team>(team, 'updateTeam', teamDtoUpdateRequest);
  }

  deleteTeam(team: Team) {
    if (!this.halFormService.canAction(team, 'deleteTeam')) {
      throw new Error("L'action deleteTeam n'est pas disponible sur l'objet " + team);
    }
    return this.halFormService.doAction<void>(team, 'deleteTeam');
  }


  getTrainingSessions(team: Team): Observable<TrainingSession[]> {
    return this.halFormService
      .follow<AllHalResources<TrainingSession>>(team, 'trainingSessions')
      .pipe(
        map(resource => this.halFormService.unwrap<TrainingSession[]>(resource, 'trainingSessions')),
        catchError(_ => of([])) // en cas d'erreur, renvoyer []
      );
  }


  getRoleCoaches(team: Team): Observable<RoleCoach[]> {
    return this.halFormService
      .follow<AllHalResources<RoleCoach>>(team, 'roleCoaches')
      .pipe(
        map(resource => this.halFormService.unwrap<RoleCoach[]>(resource, 'roleCoaches')),
        catchError(_ => of([])) // en cas d'erreur, renvoyer []
      );
  }


  private addTrainingSessions(team: Team, trainingSessionsDTORequest: AddTrainingSessionInTeamDTORequest[]): Observable<TrainingSession[]> {
    if (!this.halFormService.canAction(team, 'addTrainingSession')) {
      throw new Error("L'action addTrainingSession n'est pas disponible sur l'objet " + team);
    }
    const trainingObservables = trainingSessionsDTORequest.map(tsDTORequest =>
      this.halFormService.doAction<TrainingSession>(team, 'addTrainingSession', tsDTORequest)
    );
    return trainingObservables.length ? forkJoin(trainingObservables) : of([]);
  }

  private addRoleCoaches(team: Team, roleCoachesDTORequest: AddRoleCoachInTeamDTORequest[]): Observable<RoleCoach[]> {
    if (!this.halFormService.canAction(team, 'addRoleCoach')) {
      throw new Error("L'action addRoleCoach n'est pas disponible sur l'objet " + team);
    }
    const roleCoachObservables = roleCoachesDTORequest.map(rcDTORequest =>
      this.halFormService.doAction<RoleCoach>(team, 'addRoleCoach', rcDTORequest)
    );
    return roleCoachObservables.length ? forkJoin(roleCoachObservables) : of([]);
  }

  private deleteTrainingSessions(trainingSession: TrainingSession[]) {
    trainingSession.forEach(ts => {
      if (!this.halFormService.canAction(ts, 'deleteTrainingSession')) {
        throw new Error("L'action deleteTrainingSession n'est pas disponible sur l'objet " + ts);
      }
    })
    const trainingSessionObservables = trainingSession.map(ts =>
      this.halFormService.doAction<void>(ts, 'deleteTrainingSession')
    );
    return trainingSessionObservables.length ? forkJoin(trainingSessionObservables) : of([]);
  }

  private deleteRoleCoaches(roleCoach: RoleCoach[]) {
    roleCoach.forEach(rc => {
      if (!this.halFormService.canAction(rc, 'deleteRoleCoach')) {
        throw new Error("L'action deleteRoleCoach n'est pas disponible sur l'objet " + rc);
      }
    })
    const roleCoachObservables = roleCoach.map(rc =>
      this.halFormService.doAction<void>(rc, 'deleteRoleCoach')
    );
    return roleCoachObservables.length ? forkJoin(roleCoachObservables) : of([]);
  }
}

